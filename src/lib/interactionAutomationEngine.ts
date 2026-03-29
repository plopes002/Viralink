// src/lib/interactionAutomationEngine.ts
import { adminFirestore } from "@/lib/firebaseAdmin";

function normalizeText(text: string) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function sendPublicReply(params: {
  socialAccountId: string;
  commentId: string;
  message: string;
}) {
  const { socialAccountId, commentId, message } = params;

  const socialDoc = await adminFirestore
    .collection("socialAccounts")
    .doc(socialAccountId)
    .get();

  if (!socialDoc.exists) {
    throw new Error("socialAccount não encontrada para resposta pública.");
  }

  const social = socialDoc.data() as any;
  const accessToken = social.pageAccessToken || social.accessToken || "";

  if (!accessToken) {
    throw new Error("Token não encontrado para resposta pública.");
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(commentId)}/replies`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        message,
        access_token: accessToken,
      }).toString(),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Erro ao responder comentário publicamente."
    );
  }

  return data;
}

async function sendPrivateReply(params: {
  socialAccountId: string;
  commentId: string;
  message: string;
}) {
  const { socialAccountId, commentId, message } = params;

  const socialDoc = await adminFirestore
    .collection("socialAccounts")
    .doc(socialAccountId)
    .get();

  if (!socialDoc.exists) {
    throw new Error("socialAccount não encontrada para resposta privada.");
  }

  const social = socialDoc.data() as any;
  const accessToken = social.pageAccessToken || social.accessToken || "";
  const pageId = social.facebookPageId || "";

  if (!accessToken) {
    throw new Error("Token não encontrado para resposta privada.");
  }

  if (!pageId) {
    throw new Error("facebookPageId não encontrado para resposta privada.");
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: {
          comment_id: commentId,
        },
        message: {
          text: message,
        },
        access_token: accessToken,
      }),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Erro ao enviar resposta privada."
    );
  }

  return data;
}

function ruleMatchesComment(rule: any, commentText: string) {
  if (!rule?.active) return false;

  const normalizedComment = normalizeText(commentText);
  const matchType = rule.matchType || rule.triggerType || "contains";

  if (matchType === "all") {
    return true;
  }

  const keywords = Array.isArray(rule.keywords) ? rule.keywords : [];
  const normalizedKeywords = keywords
    .map((k: string) => normalizeText(k))
    .filter(Boolean);

  if (!normalizedKeywords.length) {
    return false;
  }

  if (matchType === "exact") {
    return normalizedKeywords.includes(normalizedComment);
  }

  return normalizedKeywords.some((keyword: string) =>
    normalizedComment.includes(keyword)
  );
}

export async function processInteractionAutomation(interactionId: string) {
  const interactionRef = adminFirestore
    .collection("supporterInteractions")
    .doc(interactionId);

  const interactionSnap = await interactionRef.get();

  if (!interactionSnap.exists) {
    throw new Error("Interação não encontrada no engine");
  }

  const interaction = interactionSnap.data() as any;

  if (!interaction.workspaceId) {
    throw new Error("interaction.workspaceId undefined");
  }

  if (!interaction.primaryAccountId) {
    throw new Error("interaction.primaryAccountId undefined");
  }

  if (!interaction.commenterText) {
    throw new Error("interaction.commenterText undefined");
  }

  const rulesSnap = await adminFirestore
    .collection("interactionAutomationRules")
    .where("workspaceId", "==", interaction.workspaceId)
    .where("primaryAccountId", "==", interaction.primaryAccountId)
    .where("active", "==", true)
    .get();

  if (rulesSnap.empty) {
    await interactionRef.set(
      {
        automationMatched: false,
        automationProcessedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { matched: false, executed: [] };
  }

  const rules = rulesSnap.docs
    .map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    }))
    .sort((a, b) => Number(a.priority || 100) - Number(b.priority || 100));

  let matchedRule: any = null;

  for (const rule of rules) {
    if (ruleMatchesComment(rule, interaction.commenterText)) {
      matchedRule = rule;
      break;
    }
  }

  if (!matchedRule) {
    await interactionRef.set(
      {
        automationMatched: false,
        automationProcessedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { matched: false, executed: [] };
  }

  const sourceCampaignAccountId = interaction.sourceCampaignAccountId;

  if (!sourceCampaignAccountId) {
    throw new Error("interaction.sourceCampaignAccountId undefined");
  }

  const campaignDoc = await adminFirestore
    .collection("campaignAccounts")
    .doc(sourceCampaignAccountId)
    .get();

  if (!campaignDoc.exists) {
    throw new Error("campaignAccount não encontrada.");
  }

  const campaign = campaignDoc.data() as any;
  const socialAccountId = campaign.socialAccountId;

  if (!socialAccountId) {
    throw new Error("campaignAccount sem socialAccountId.");
  }

  const actions = matchedRule.actions || {};
  const publicReplyTemplate =
    matchedRule.replyTemplatePublic ||
    matchedRule.publicReplyTemplate ||
    null;
  const privateReplyTemplate =
    matchedRule.replyTemplatePrivate ||
    matchedRule.privateReplyTemplate ||
    null;

  const updates: Record<string, any> = {
    automationMatched: true,
    automationRuleId: matchedRule.id,
    automationRuleName: matchedRule.name,
    automationProcessedAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    automationLastError: null,
    updatedAt: new Date().toISOString(),
  };

  const executed: string[] = [];

  try {
    if (actions.markAsRead) {
      updates.status = "read";
      executed.push("markAsRead");
    }

    if (
      actions.publicReply &&
      publicReplyTemplate &&
      interaction.externalCommentId &&
      !interaction.publicReplyMeta?.automated
    ) {
      await sendPublicReply({
        socialAccountId,
        commentId: interaction.externalCommentId,
        message: publicReplyTemplate,
      });

      updates.publicReplyText = publicReplyTemplate;
      updates.publicReplyMeta = {
        automated: true,
        sentAt: new Date().toISOString(),
        ruleId: matchedRule.id,
      };
      updates.status = "replied";
      executed.push("publicReply");
    }

    if (
      actions.privateReply &&
      privateReplyTemplate &&
      interaction.externalCommentId &&
      !interaction.privateReplyMeta?.automated
    ) {
      await sendPrivateReply({
        socialAccountId,
        commentId: interaction.externalCommentId,
        message: privateReplyTemplate,
      });

      updates.privateReplyText = privateReplyTemplate;
      updates.privateReplyMeta = {
        automated: true,
        sentAt: new Date().toISOString(),
        ruleId: matchedRule.id,
      };
      updates.status = "private_replied";
      executed.push("privateReply");
    }

    if (actions.convertToLead) {
      const existingLeadSnap = await adminFirestore
        .collection("supporterLeads")
        .where("sourceInteractionId", "==", interactionId)
        .limit(1)
        .get();

      if (existingLeadSnap.empty) {
        await adminFirestore.collection("supporterLeads").add({
          workspaceId: interaction.workspaceId,
          primaryAccountId: interaction.primaryAccountId,
          sourceCampaignAccountId: interaction.sourceCampaignAccountId || null,
          sourceInteractionId: interactionId,
          leadName: interaction.commenterUsername || "Lead Instagram",
          instagramUsername: interaction.commenterUsername || "",
          note: interaction.commenterText || "",
          status: "new",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      updates.status = "lead";
      executed.push("convertToLead");
    }

    updates.automationExecutedActions = executed;

    await interactionRef.set(updates, { merge: true });

    return {
      matched: true,
      ruleName: matchedRule.name,
      executed,
    };
  } catch (error: any) {
    await interactionRef.set(
      {
        automationMatched: true,
        automationRuleId: matchedRule.id,
        automationRuleName: matchedRule.name,
        automationProcessedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        automationExecutedActions: executed,
        automationLastError:
          error?.message || "Erro desconhecido ao executar automação.",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    throw error;
  }
}