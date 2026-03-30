// src/lib/instagramCommentsSync.ts
import "server-only";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { processInteractionAutomation } from "@/lib/interactionAutomationEngine";

type MetaMedia = {
  id: string;
  caption?: string;
  timestamp?: string;
};

type MetaComment = {
  id: string;
  text?: string;
  username?: string;
  timestamp?: string;
};

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Erro na API da Meta.");
  }

  return data;
}

function removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });

  return obj;
}

export async function syncInstagramCommentsForSocialAccount(params: {
  workspaceId: string;
  socialAccountId: string;
  accountId: string;
  accessToken: string;
  sourceRole?: "primary" | "supporter";
  sourceCampaignAccountId?: string | null;
  sourceName?: string;
  sourceUsername?: string;
}) {
  const {
    workspaceId,
    socialAccountId,
    accountId,
    accessToken,
    sourceRole = "primary",
    sourceCampaignAccountId = null,
    sourceName = "Conta principal",
    sourceUsername = "",
  } = params;

  const primaryCampaignSnap = await adminFirestore
    .collection("campaignAccounts")
    .where("workspaceId", "==", workspaceId)
    .where("role", "==", "primary")
    .limit(1)
    .get();

  if (primaryCampaignSnap.empty) {
    throw new Error("Conta principal não encontrada.");
  }

  const primaryCampaignId = primaryCampaignSnap.docs[0].id;

  const mediaUrl =
    `https://graph.facebook.com/v20.0/${encodeURIComponent(accountId)}/media` +
    `?fields=id,caption,media_type,permalink,timestamp` +
    `&limit=10` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  const mediaData = await fetchJson(mediaUrl);
  const mediaItems: MetaMedia[] = Array.isArray(mediaData?.data)
    ? mediaData.data
    : [];

  let inserted = 0;
  let updated = 0;

  for (const media of mediaItems) {
    const commentsUrl =
      `https://graph.facebook.com/v20.0/${encodeURIComponent(media.id)}/comments` +
      `?fields=id,text,username,timestamp` +
      `&limit=50` +
      `&access_token=${encodeURIComponent(accessToken)}`;

    const commentsData = await fetchJson(commentsUrl);
    const comments: MetaComment[] = Array.isArray(commentsData?.data)
      ? commentsData.data
      : [];

    for (const comment of comments) {
      const stableSourceId = sourceCampaignAccountId || accountId;
      const interactionId = `${workspaceId}_${stableSourceId}_${comment.id}`;

      const ref = adminFirestore
        .collection("supporterInteractions")
        .doc(interactionId);

      const existing = await ref.get();
      const existingData = existing.exists ? (existing.data() as any) : null;

      const payload = removeUndefinedFields({
        workspaceId,
        primaryAccountId: primaryCampaignId,
        sourceCampaignAccountId: sourceCampaignAccountId || primaryCampaignId,
        sourceRole,
        sourceName,
        sourceUsername,
        network: "instagram",
        interactionType: "comment",
        externalCommentId: comment.id,
        externalMediaId: media.id,
        mediaCaption: media.caption || "",
        commenterId: comment.id,
        commenterUsername: comment.username || "",
        commenterText: comment.text || "",
        status: existingData?.status || "new",
        assignedToUserId: existingData?.assignedToUserId || null,
        publicReplyText: existingData?.publicReplyText || null,
        privateReplyText: existingData?.privateReplyText || null,
        publicReplyMeta: existingData?.publicReplyMeta || null,
        privateReplyMeta: existingData?.privateReplyMeta || null,

        // 🔒 nunca undefined
        automationMatched:
          typeof existingData?.automationMatched === "boolean"
            ? existingData.automationMatched
            : false,

        automationRuleId: existingData?.automationRuleId || null,
        automationRuleName: existingData?.automationRuleName || null,
        automationExecutedActions: Array.isArray(existingData?.automationExecutedActions)
          ? existingData.automationExecutedActions
          : [],
        automationProcessedAt: existingData?.automationProcessedAt || null,
        automationLastError: existingData?.automationLastError || null,

        commentTimestamp: comment.timestamp || null,
        capturedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (!existing.exists) {
        await ref.set({
          ...payload,
          createdAt: new Date().toISOString(),
        });

        inserted += 1;

        try {
          await processInteractionAutomation(interactionId);
        } catch (automationError) {
          console.error(
            "[instagramCommentsSync] erro ao processar automação:",
            automationError
          );
        }
      } else {
        await ref.set(payload, { merge: true });
        updated += 1;

        if (
          !existingData?.automationProcessedAt &&
          (existingData?.status === "new" ||
            existingData?.status === "read" ||
            !existingData?.status)
        ) {
          try {
            await processInteractionAutomation(interactionId);
          } catch (automationError) {
            console.error(
              "[instagramCommentsSync] erro ao reprocessar automação:",
              automationError
            );
          }
        }
      }
    }
  }

  return {
    ok: true,
    inserted,
    updated,
  };
}
