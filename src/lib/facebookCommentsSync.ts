// src/lib/facebookCommentsSync.ts
import "server-only";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { processInteractionAutomation } from "@/lib/interactionAutomationEngine";

type FacebookPost = {
  id: string;
  message?: string;
  created_time?: string;
};

type FacebookComment = {
  id: string;
  message?: string;
  created_time?: string;
  from?: {
    id?: string;
    name?: string;
  };
};

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Erro na API do Facebook.");
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

export async function syncFacebookCommentsForSocialAccount(params: {
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

  const postsUrl =
    `https://graph.facebook.com/v25.0/${encodeURIComponent(accountId)}/published_posts` +
    `?fields=id,message,created_time` +
    `&limit=10` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  const postsData = await fetchJson(postsUrl);
  const posts: FacebookPost[] = Array.isArray(postsData?.data)
    ? postsData.data
    : [];

  console.log("[facebookCommentsSync] accountId:", accountId);
  console.log("[facebookCommentsSync] sourceRole:", sourceRole);
  console.log(
    "[facebookCommentsSync] sourceCampaignAccountId:",
    sourceCampaignAccountId
  );
  console.log("[facebookCommentsSync] posts found:", posts.length);

  let inserted = 0;
  let updated = 0;

  for (const post of posts) {
    const commentsUrl =
      `https://graph.facebook.com/v25.0/${encodeURIComponent(post.id)}/comments` +
      `?fields=id,message,created_time,from{id,name}` +
      `&limit=50` +
      `&access_token=${encodeURIComponent(accessToken)}`;

    const commentsData = await fetchJson(commentsUrl);
    const comments: FacebookComment[] = Array.isArray(commentsData?.data)
      ? commentsData.data
      : [];

    console.log(
      "[facebookCommentsSync] post:",
      post.id,
      "comments:",
      comments.length
    );

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
        network: "facebook",
        interactionType: "comment",

        externalCommentId: comment.id,
        externalMediaId: post.id,
        mediaCaption: post.message || "",

        commenterId: comment.from?.id || comment.id,
        commenterUsername: comment.from?.name || "",
        commenterText: comment.message || "",

        status: existingData?.status || "new",
        assignedToUserId: existingData?.assignedToUserId || null,
        publicReplyText: existingData?.publicReplyText || null,
        privateReplyText: existingData?.privateReplyText || null,
        publicReplyMeta: existingData?.publicReplyMeta || null,
        privateReplyMeta: existingData?.privateReplyMeta || null,

        automationMatched:
          typeof existingData?.automationMatched === "boolean"
            ? existingData.automationMatched
            : false,

        automationRuleId: existingData?.automationRuleId || null,
        automationRuleName: existingData?.automationRuleName || null,
        automationExecutedActions: Array.isArray(
          existingData?.automationExecutedActions
        )
          ? existingData.automationExecutedActions
          : [],
        automationProcessedAt: existingData?.automationProcessedAt || null,
        automationLastError: existingData?.automationLastError || null,

        commentTimestamp: comment.created_time || null,
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
            "[facebookCommentsSync] erro ao processar automação:",
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
              "[facebookCommentsSync] erro ao reprocessar automação:",
              automationError
            );
          }
        }
      }
    }
  }

  console.log("[facebookCommentsSync] final result:", {
    inserted,
    updated,
  });

  return {
    ok: true,
    inserted,
    updated,
  };
}