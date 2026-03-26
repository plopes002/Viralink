// src/app/api/campaigns/dispatch/route.ts
import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { DELIVERY_POLICIES } from '@/constants/deliveryPolicies';
import { calculateCampaignRisk } from '@/lib/campaignRisk';
import { hasRecentSimilarMessage } from '@/lib/messageDedup';
import { scheduleMessageTime } from '@/lib/scheduleMessages';
import { isSuppressed } from '@/lib/suppression';


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
    
    const policy = DELIVERY_POLICIES[channel];
    if (!policy) {
        return NextResponse.json({ error: `Política de entrega não encontrada para o canal ${channel}.`}, { status: 400 });
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

    const limitedRecipients = recipients.slice(0, policy.maxPerDay);

    const risk = calculateCampaignRisk({
        recipientsCount: limitedRecipients.length,
        channel,
        audienceMode,
        hasColdLeads: limitedRecipients.some(p => p.leadTemperature === 'cold'),
        hasNonFollowers: limitedRecipients.some(p => !p.isFollower),
    });

    const campaignStatus = risk === 'high' ? 'draft' : 'queued';


    const now = new Date().toISOString();

    const campaignRef = await adminFirestore.collection("campaigns").add({
      workspaceId,
      name,
      channel,
      message,
      audienceFilters: filters || {},
      recipientsCount: limitedRecipients.length,
      status: campaignStatus,
      createdAt: now,
      updatedAt: now,
    });

    let messageIndex = 0;
    for (const recipient of limitedRecipients) {
        
        const suppressed = await isSuppressed({
            workspaceId,
            toUser: recipient.username || null,
            toPhone: recipient.phone || null,
        });

        if (suppressed) {
            await adminFirestore.collection("messages").add({
                workspaceId,
                campaignId: campaignRef.id,
                toUser: recipient.username,
                channel,
                content: "Skipped due to suppression list",
                status: "skipped",
                createdAt: now,
                errorMessage: "Suppression List: Recipient opted out.",
            });
            continue;
        }

        const duplicate = await hasRecentSimilarMessage({
            workspaceId,
            toUser: recipient.username || null,
            toPhone: recipient.phone || null,
            channel,
            lookbackHours: audienceMode === 'competitor' ? 168 : 72,
        });

        if (duplicate) {
            await adminFirestore.collection("messages").add({
                workspaceId,
                campaignId: campaignRef.id,
                toUser: recipient.username,
                channel,
                content: "Skipped due to recent contact",
                status: "skipped",
                createdAt: now,
                errorMessage: "Deduplication: Recent similar message found.",
            });
            continue;
        }
        
        const shouldReview =
            risk === 'high' ||
            (audienceMode === 'competitor' && !recipient.hasInteracted) ||
            recipient.leadTemperature === 'cold';

        const initialMessageStatus = shouldReview ? "awaiting_review" : "scheduled";

        const scheduledAt = scheduleMessageTime({
            channel,
            index: messageIndex,
        });

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
            status: initialMessageStatus,
            scheduledAt: initialMessageStatus === 'scheduled' ? scheduledAt : null,
            createdAt: now,
            errorMessage: null,
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

        messageIndex++;
    }

    return NextResponse.json({
      ok: true,
      campaignId: campaignRef.id,
      recipientsCount: limitedRecipients.length,
      limited: recipients.length > policy.maxPerDay,
      note:
        recipients.length > policy.maxPerDay
          ? `Por segurança, apenas ${policy.maxPerDay} destinatários foram enfileirados nesta ação.`
          : `Campanha enfileirada com status: ${campaignStatus}.`,
    });
  } catch (err) {
    console.error("[campaign dispatch] erro:", err);
    return NextResponse.json(
      { error: "Erro ao disparar campanha." },
      { status: 500 },
    );
  }
}
