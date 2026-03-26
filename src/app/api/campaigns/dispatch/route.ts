// src/app/api/campaigns/dispatch/route.ts
import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

// Helper function to filter profiles based on various criteria
function matchesFilters(profile: any, filters: any, audienceMode: string) {
    if (audienceMode === "competitor") {
        if (filters?.onlyNonFollowers && profile.isFollower) return false;
        if (filters?.onlyEngaged && !profile.hasInteracted) return false;
        if (filters?.sentiment && filters.sentiment !== 'all' && profile.sentiment !== filters.sentiment) return false;
        if (filters?.interactionType && filters.interactionType !== 'all' && profile.interactionType !== filters.interactionType) return false;
        return true;
    }

    // Default filtering for profiles and contacts
    if (filters.temperature && filters.temperature !== "all") {
        if (profile.leadTemperature !== filters.temperature) return false;
    }
    if (filters.followStatus === "followers" && !profile.isFollower) {
        return false;
    }
    if (filters.followStatus === "non_followers" && profile.isFollower) {
        return false;
    }
    if (filters.category && filters.category !== "all") {
        if (!(profile.categories || []).includes(filters.category)) {
        return false;
        }
    }
    if (filters.operationalTag && filters.operationalTag !== "all") {
        if (!(profile.operationalTags || []).includes(filters.operationalTag)) {
        return false;
        }
    }
    if (filters.search && String(filters.search).trim()) {
        const term = String(filters.search).toLowerCase();
        const haystack = [
        profile.name,
        profile.username,
        ...(profile.categories || []),
        ...(profile.interestTags || []),
        ...(profile.operationalTags || []),
        ...(profile.politicalEntities || []),
        ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
        if (!haystack.includes(term)) return false;
    }

    return true;
}


// Helper to personalize messages with user data
function applyVariables(message: string, profile: any) {
  const firstName = String(profile.name || "").split(" ")[0] || "";
  return message
    .replace(/\{\{nome\}\}/gi, firstName)
    .replace(/\{\{nome_completo\}\}/gi, profile.name || "")
    .replace(/\{\{usuario\}\}/gi, profile.username || "");
}


// Helper to add context for competitor campaigns
function generateCompetitorMessage(baseMessage: string, lead: any) {
    let prefix = "";
    if (lead.interactionType === "comment") {
        prefix = "Vi que você comentou recentemente em um conteúdo 👀 ";
    }
    if (lead.interactionType === "like") {
        prefix = "Vi que você curtiu um conteúdo recentemente 👍 ";
    }
    if (lead.interactionType === "view") {
        prefix = "Notei que você visualizou um conteúdo recentemente 👀 ";
    }
    return `${prefix}${baseMessage}`;
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      workspaceId,
      name,
      channel,
      message,
      filters,
      audienceMode = "profiles",
    } = body || {};

    if (!workspaceId || !name || !channel || !message) {
      return NextResponse.json(
        { error: "workspaceId, name, channel e message são obrigatórios." },
        { status: 400 },
      );
    }

    const collectionName =
        audienceMode === "contacts"
            ? "contacts"
            : audienceMode === "competitor"
            ? "competitorLeads"
            : "engagementProfiles";

    const baseSnap = await adminFirestore
      .collection(collectionName)
      .where("workspaceId", "==", workspaceId)
      .get();

    const allRecipients = baseSnap.docs.map((d) => {
        const data = d.data() as any;
        if (audienceMode === "competitor") {
            return {
                id: d.id,
                username: data.username,
                name: data.name || data.username,
                hasInteracted: data.hasInteracted,
                interactionType: data.interactionType,
                sentiment: data.sentiment,
                isFollower: data.isFollower,
                workspaceId: data.workspaceId,
            };
        }
        return {
            id: d.id,
            ...(data as any),
        };
    });

    const recipients = allRecipients.filter((profile) =>
      matchesFilters(profile, filters || {}, audienceMode),
    );

    // segurança anti-volume exagerado
    const MAX_DISPATCH = 80;
    const limitedRecipients = recipients.slice(0, MAX_DISPATCH);

    const now = new Date().toISOString();

    const campaignRef = await adminFirestore.collection("campaigns").add({
      workspaceId,
      name,
      channel,
      message,
      audienceFilters: filters || {},
      recipientsCount: limitedRecipients.length,
      status: "queued",
      createdAt: now,
      updatedAt: now,
    });

    for (const recipient of limitedRecipients) {
        const personalizedMessage =
            audienceMode === "competitor"
                ? generateCompetitorMessage(message, recipient)
                : message;

        await adminFirestore.collection("messages").add({
            workspaceId,
            campaignId: campaignRef.id,
            toUser: recipient.username,
            toPhone: recipient.phone || null,
            toEmail: recipient.email || null,
            channel,
            content: applyVariables(personalizedMessage, recipient),
            status: "queued",
            createdAt: now,
        });

        if (audienceMode === "contacts") {
            await adminFirestore.collection("contactHistory").add({
                workspaceId,
                contactId: recipient.id,
                type: "campaign_sent",
                title: "Campanha enviada",
                description: `Campanha: ${name}`,
                metadata: {
                    campaignId: campaignRef.id,
                    channel,
                },
                createdAt: now,
            });
        }
        
        if (audienceMode === "competitor") {
            await adminFirestore.collection("contactHistory").add({
              workspaceId,
              contactId: recipient.id,
              type: "campaign_sent",
              title: "Campanha de concorrente enviada",
              description: `Campanha: ${name}`,
              metadata: {
                channel,
                competitor: true,
                interactionType: recipient.interactionType,
              },
              createdAt: now,
            });
        }
    }

    return NextResponse.json({
      ok: true,
      campaignId: campaignRef.id,
      recipientsCount: limitedRecipients.length,
      limited: recipients.length > MAX_DISPATCH,
      note:
        recipients.length > MAX_DISPATCH
          ? `Por segurança, apenas ${MAX_DISPATCH} destinatários foram enfileirados nesta ação.`
          : "Campanha enfileirada com sucesso.",
    });
  } catch (err) {
    console.error("[campaign dispatch] erro:", err);
    return NextResponse.json(
      { error: "Erro ao disparar campanha." },
      { status: 500 },
    );
  }
}
