// src/app/api/campaigns/dispatch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { scheduleMessageTime } from "@/lib/scheduleMessages";
import { hasRecentSimilarMessage } from "@/lib/messageDedup";
import { isSuppressed } from "@/lib/suppression";
import { getMasterScopeWorkspaceIds, getLinkedChildrenWithScopes } from "@/lib/multiAccountScope";

type AudienceMode = "profiles" | "contacts" | "competitor";
type CampaignChannel = "instagram_dm" | "facebook_dm" | "whatsapp";

function applyVariables(message: string, recipient: any) {
  const firstName = String(recipient.name || "").split(" ")[0] || "";
  return message
    .replace(/\{\{nome\}\}/gi, firstName)
    .replace(/\{\{nome_completo\}\}/gi, recipient.name || "")
    .replace(/\{\{usuario\}\}/gi, recipient.username || "");
}

function generateCompetitorMessage(baseMessage: string, lead: any) {
  let prefix = "";

  if (lead.interactionType === "comment") {
    prefix = "Vi que você comentou recentemente em um conteúdo 👀 ";
  } else if (lead.interactionType === "like") {
    prefix = "Vi que você curtiu um conteúdo recentemente 👍 ";
  } else if (lead.interactionType === "view") {
    prefix = "Notei que você visualizou um conteúdo recentemente 👀 ";
  } else if (lead.interactionType === "reaction") {
    prefix = "Vi que você reagiu a um conteúdo recentemente 👍 ";
  }

  return `${prefix}${baseMessage}`;
}

function matchesCommonFilters(recipient: any, filters: any) {
  if (filters?.temperature && filters.temperature !== "all") {
    if (recipient.leadTemperature !== filters.temperature) return false;
  }

  if (filters?.followStatus === "followers" && !recipient.isFollower) {
    return false;
  }

  if (filters?.followStatus === "non_followers" && recipient.isFollower) {
    return false;
  }

  if (filters?.category && filters.category !== "all") {
    if (!(recipient.categories || []).includes(filters.category)) {
      return false;
    }
  }

  if (filters?.operationalTag && filters.operationalTag !== "all") {
    if (!(recipient.operationalTags || []).includes(filters.operationalTag)) {
      return false;
    }
  }

  if (filters?.search && String(filters.search).trim()) {
    const term = String(filters.search).trim().toLowerCase();

    const haystack = [
      recipient.name,
      recipient.username,
      recipient.phone,
      recipient.email,
      ...(recipient.categories || []),
      ...(recipient.interestTags || []),
      ...(recipient.operationalTags || []),
      ...(recipient.politicalEntities || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(term)) return false;
  }

  return true;
}

function matchesCompetitorFilters(recipient: any, filters: any) {
  if (filters?.onlyNonFollowers && recipient.isFollower) return false;
  if (filters?.onlyEngaged && !recipient.hasInteracted) return false;

  if (filters?.sentiment && filters.sentiment !== "all") {
    if (recipient.sentiment !== filters.sentiment) return false;
  }

  if (filters?.interactionType && filters.interactionType !== "all") {
    if (recipient.interactionType !== filters.interactionType) return false;
  }

  if (filters?.competitorId && filters.competitorId !== "all") {
    if (recipient.competitorId !== filters.competitorId) return false;
  }

  return true;
}

function calculateCampaignRisk(params: {
  recipientsCount: number;
  audienceMode: AudienceMode;
  hasColdLeads: boolean;
  hasNonFollowers: boolean;
}) {
  let risk = 0;

  if (params.recipientsCount > 50) risk += 30;
  if (params.audienceMode === "competitor") risk += 25;
  if (params.hasColdLeads) risk += 20;
  if (params.hasNonFollowers) risk += 10;

  if (risk >= 60) return "high";
  if (risk >= 30) return "medium";
  return "low";
}

function shouldRequireReview(params: {
  audienceMode: AudienceMode;
  recipient: any;
  risk: "low" | "medium" | "high";
}) {
  if (params.risk === "high") return true;

  if (params.audienceMode === "competitor") {
    if (!params.recipient.hasInteracted) return true;
    if (params.recipient.sentiment === "negative") return true;
  }

  if (params.recipient.leadTemperature === "cold") return true;

  return false;
}

async function refreshCampaignStatus(campaignId: string) {
  const snap = await adminFirestore
    .collection("messages")
    .where("campaignId", "==", campaignId)
    .get();

  const items = snap.docs.map((d) => d.data() as any);

  const review = items.filter((m) => m.status === "awaiting_review").length;
  const scheduled = items.filter((m) => m.status === "scheduled").length;
  const processing = items.filter((m) => m.status === "processing").length;
  const sent = items.filter((m) => m.status === "sent").length;
  const skipped = items.filter((m) => m.status === "skipped").length;
  const error = items.filter((m) => m.status === "error").length;

  const total = items.length;

  let status: "queued" | "processing" | "done" | "error" = "queued";

  if (review > 0 || scheduled > 0) {
    status = "queued";
  } else if (processing > 0) {
    status = "processing";
  } else if (sent + skipped === total && total > 0) {
    status = "done";
  } else if (error > 0 && sent === 0 && scheduled === 0 && review === 0) {
    status = "error";
  }

  await adminFirestore.collection("campaigns").doc(campaignId).update({
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      workspaceId,
      includeChildWorkspaces = false,
      name,
      channel,
      message,
      filters = {},
      audienceMode = "profiles",
    }: {
      workspaceId?: string;
      includeChildWorkspaces?: boolean;
      name?: string;
      channel?: CampaignChannel;
      message?: string;
      filters?: Record<string, any>;
      audienceMode?: AudienceMode;
    } = body || {};

    if (!workspaceId || !name || !channel || !message) {
      return NextResponse.json(
        {
          error:
            "workspaceId, name, channel e message são obrigatórios.",
        },
        { status: 400 },
      );
    }
    
    let workspaceIds: string[] = [workspaceId];

    if (includeChildWorkspaces) {
      const links = await getLinkedChildrenWithScopes(workspaceId);
      workspaceIds = [
        workspaceId,
        ...links
          .filter((l) => l.scopes?.campaigns)
          .map((l) => l.childWorkspaceId),
      ];
    }

    const collectionName =
      audienceMode === "contacts"
        ? "contacts"
        : audienceMode === "competitor"
        ? "competitorLeads"
        : "engagementProfiles";

    const allDocsArrays = await Promise.all(
      workspaceIds.map(async (wid) => {
        const snap = await adminFirestore
          .collection(collectionName)
          .where("workspaceId", "==", wid)
          .get();

        return snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
      }),
    );

    const allRecipients = allDocsArrays.flat();


    const recipients = allRecipients.filter((recipient) => {
      if (!matchesCommonFilters(recipient, filters)) return false;

      if (audienceMode === "competitor") {
        if (!matchesCompetitorFilters(recipient, filters)) return false;
      }

      return true;
    });

    const hasColdLeads = recipients.some(
      (r) => r.leadTemperature === "cold",
    );
    const hasNonFollowers = recipients.some((r) => !r.isFollower);

    const risk = calculateCampaignRisk({
      recipientsCount: recipients.length,
      audienceMode,
      hasColdLeads,
      hasNonFollowers,
    });

    const MAX_DISPATCH =
      risk === "high" ? 20 : risk === "medium" ? 40 : 80;

    const limitedRecipients = recipients.slice(0, MAX_DISPATCH);

    const now = new Date().toISOString();

    const campaignRef = await adminFirestore.collection("campaigns").add({
      workspaceId,
      name,
      channel,
      message,
      audienceFilters: filters,
      audienceMode,
      recipientsCount: limitedRecipients.length,
      status: "queued",
      riskLevel: risk,
      createdAt: now,
      updatedAt: now,
    });

    let scheduledCount = 0;
    let reviewCount = 0;
    let skippedCount = 0;

    for (let index = 0; index < limitedRecipients.length; index++) {
      const recipient = limitedRecipients[index];

      const suppressed = await isSuppressed({
        workspaceId: recipient.workspaceId, // Use recipient's workspaceId
        toUser: recipient.username || null,
        toPhone: recipient.phone || null,
      });

      if (suppressed) {
        await adminFirestore.collection("messages").add({
          workspaceId: recipient.workspaceId,
          campaignId: campaignRef.id,
          toUser: recipient.username || null,
          toPhone: recipient.phone || null,
          toEmail: recipient.email || null,
          channel,
          content: applyVariables(message, recipient),
          status: "skipped",
          scheduledAt: null,
          createdAt: now,
          updatedAt: now,
          errorMessage: "Envio pulado por suppression list.",
        });
        skippedCount++;
        continue;
      }

      const duplicate = await hasRecentSimilarMessage({
        workspaceId: recipient.workspaceId,
        toUser: recipient.username || null,
        toPhone: recipient.phone || null,
        channel,
        lookbackHours: audienceMode === "competitor" ? 168 : 72,
      });

      if (duplicate) {
        await adminFirestore.collection("messages").add({
          workspaceId: recipient.workspaceId,
          campaignId: campaignRef.id,
          toUser: recipient.username || null,
          toPhone: recipient.phone || null,
          toEmail: recipient.email || null,
          channel,
          content: applyVariables(message, recipient),
          status: "skipped",
          scheduledAt: null,
          createdAt: now,
          updatedAt: now,
          errorMessage: "Envio pulado por dedupe.",
        });
        skippedCount++;
        continue;
      }

      const rawContent =
        audienceMode === "competitor"
          ? generateCompetitorMessage(message, recipient)
          : message;

      const finalContent = applyVariables(rawContent, recipient);

      const review = shouldRequireReview({
        audienceMode,
        recipient,
        risk,
      });

      if (review) {
        await adminFirestore.collection("messages").add({
          workspaceId: recipient.workspaceId,
          campaignId: campaignRef.id,
          toUser: recipient.username || null,
          toPhone: recipient.phone || null,
          toEmail: recipient.email || null,
          channel,
          content: finalContent,
          status: "awaiting_review",
          scheduledAt: null,
          createdAt: now,
          updatedAt: now,
          errorMessage: null,
        });
        reviewCount++;
      } else {
        const scheduledAt = scheduleMessageTime({
          channel,
          index,
          fromDate: new Date(),
        });

        await adminFirestore.collection("messages").add({
          workspaceId: recipient.workspaceId,
          campaignId: campaignRef.id,
          toUser: recipient.username || null,
          toPhone: recipient.phone || null,
          toEmail: recipient.email || null,
          channel,
          content: finalContent,
          status: "scheduled",
          scheduledAt,
          createdAt: now,
          updatedAt: now,
          errorMessage: null,
        });
        scheduledCount++;
      }

      if (audienceMode === "contacts") {
        await adminFirestore.collection("contactHistory").add({
          workspaceId: recipient.workspaceId,
          contactId: recipient.id,
          type: "campaign_sent",
          title: "Campanha enviada",
          description: `Campanha: ${name}`,
          metadata: {
            campaignId: campaignRef.id,
            channel,
            audienceMode,
          },
          createdAt: now,
        });
      }

      if (audienceMode === "competitor") {
        await adminFirestore.collection("contactHistory").add({
          workspaceId: recipient.workspaceId,
          contactId: recipient.id,
          type: "campaign_sent",
          title: "Campanha de concorrente enviada",
          description: `Campanha: ${name}`,
          metadata: {
            campaignId: campaignRef.id,
            channel,
            competitor: true,
            interactionType: recipient.interactionType,
          },
          createdAt: now,
        });
      }
    }

    await refreshCampaignStatus(campaignRef.id);

    return NextResponse.json({
      ok: true,
      campaignId: campaignRef.id,
      recipientsCount: limitedRecipients.length,
      riskLevel: risk,
      scheduledCount,
      reviewCount,
      skippedCount,
      limited: recipients.length > MAX_DISPATCH,
      note:
        recipients.length > MAX_DISPATCH
          ? `Por segurança, apenas ${MAX_DISPATCH} destinatários foram preparados nesta ação.`
          : "Campanha criada com sucesso.",
    });
  } catch (err) {
    console.error("[campaign dispatch] erro:", err);
    return NextResponse.json(
      { error: "Erro ao disparar campanha." },
      { status: 500 },
    );
  }
}
