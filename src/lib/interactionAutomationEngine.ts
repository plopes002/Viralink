
// src/lib/interactionAutomationEngine.ts
import { adminFirestore } from "@/lib/firebaseAdmin";
import {
  politicalKeywords,
  politicalPositiveWords,
  politicalNegativeWords,
} from "@/lib/politicalKeywords";
import {
  replyToInstagramComment,
  sendInstagramPrivateReply,
} from "@/lib/supporterInteractionsMeta";

function normalizeText(text: string) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function detectPoliticalSentiment(text: string) {
  const value = String(text || "").toLowerCase();

  const isPolitical = politicalKeywords.some((w) => value.includes(w));
  if (!isPolitical) return null;

  const pos = politicalPositiveWords.filter((w) => value.includes(w)).length;
  const neg = politicalNegativeWords.filter((w) => value.includes(w)).length;

  if (pos > neg) return "political_positive";
  if (neg > pos) return "political_negative";
  return "political_neutral";
}

function detectLeadIntent(text: string) {
  const value = String(text || "").toLowerCase();

  const intentWords = [
    "preço",
    "valor",
    "quanto",
    "me chama",
    "me chama no direct",
    "manda mensagem",
    "tem vaga",
    "agenda",
    "quero",
    "tenho interesse",
    "como funciona",
    "onde fica",
    "tem horário",
    "atende hoje",
    "parcelam",
    "faz desconto",
  ];

  const matches = intentWords.filter((w) => value.includes(w)).length;

  if (matches >= 2) return "high";
  if (matches === 1) return "medium";
  return null;
}

async function getSocialAccountOrThrow(socialAccountId: string) {
  const socialDoc = await adminFirestore
    .collection("socialAccounts")
    .doc(socialAccountId)
    .get();

  if (!socialDoc.exists) {
    throw new Error("socialAccount não encontrada.");
  }

  return socialDoc.data() as any;
}

async function sendFacebookPublicReply(params: {
  socialAccountId: string;
  commentId: string;
  message: string;
}) {
  const { socialAccountId, commentId, message } = params;
  const social = await getSocialAccountOrThrow(socialAccountId);

  const pageAccessToken = social.pageAccessToken || "";
  if (!pageAccessToken) {
    throw new Error("pageAccessToken não encontrado para resposta pública.");
  }

  const response = await fetch(
    `https://graph.facebook.com/v25.0/${encodeURIComponent(commentId)}/comments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        message,
        access_token: pageAccessToken,
      }).toString(),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        "Erro ao responder comentário publicamente no Facebook."
    );
  }

  return data;
}

async function sendFacebookPrivateReply(params: {
  socialAccountId: string;
  commentId: string;
  message: string;
}) {
  const { socialAccountId, commentId, message } = params;
  const social = await getSocialAccountOrThrow(socialAccountId);

  const pageAccessToken = social.pageAccessToken || "";
  const pageId = social.facebookPageId || social.accountId || "";

  if (!pageAccessToken) {
    throw new Error("pageAccessToken não encontrado para resposta privada.");
  }

  if (!pageId) {
    throw new Error(
      "facebookPageId/accountId não encontrado para resposta privada."
    );
  }

  const response = await fetch(
    `https://graph.facebook.com/v25.0/${encodeURIComponent(pageId)}/messages`,
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
        access_token: pageAccessToken,
      }),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Erro ao enviar resposta privada no Facebook."
    );
  }

  return data;
}

async function sendInstagramPublicReply(params: {
  socialAccountId: string;
  commentId: string;
  message: string;
}) {
  const { socialAccountId, commentId, message } = params;
  const social = await getSocialAccountOrThrow(socialAccountId);
  const accessToken = social.accessToken || "";

  if (!accessToken) {
    throw new Error(
      "Token não encontrado para resposta pública do Instagram."
    );
  }

  return replyToInstagramComment({
    commentId,
    message,
    accessToken,
  });
}

async function sendInstagramPrivateReplyFromSocialAccount(params: {
  socialAccountId: string;
  commentId: string;
  message: string;
}) {
  const { socialAccountId, commentId, message } = params;
  const social = await getSocialAccountOrThrow(socialAccountId);
  const accessToken = social.accessToken || "";

  if (!accessToken) {
    throw new Error(
      "Token não encontrado para resposta privada do Instagram."
    );
  }

  return sendInstagramPrivateReply({
    commentId,
    message,
    accessToken,
  });
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

  const network = String(interaction.network || "").toLowerCase();
  const isFacebook = network === "facebook";
  const isInstagram = network === "instagram";

  const commentText = String(interaction.commenterText || "");
  const politicalSentiment = detectPoliticalSentiment(commentText);
  const intentLevel = detectLeadIntent(commentText);

  let autoDM: string | null = null;

  if (intentLevel === "high") {
    autoDM =
      "Oi! 😊 Vi seu comentário e posso te ajudar melhor por aqui. Me conta rapidinho o que você está buscando?";
  }

  if (intentLevel === "medium") {
    autoDM =
      "Oi! Tudo bem? Vi que você comentou no post. Se quiser mais informações, posso te explicar melhor aqui no direct 😊";
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
      isFacebook &&
      actions.publicReply &&
      publicReplyTemplate &&
      interaction.externalCommentId &&
      !interaction.publicReplyMeta?.automated
    ) {
      let finalMessage = publicReplyTemplate;

      if (politicalSentiment === "political_positive") {
        finalMessage =
          "Muito obrigado pelo apoio! 🙌 Seguimos trabalhando firme por melhorias reais.";
      } else if (politicalSentiment === "political_negative") {
        finalMessage =
          "Respeitamos sua opinião. Estamos sempre abertos ao diálogo.";
      } else if (politicalSentiment === "political_neutral") {
        finalMessage =
          "Obrigado pelo comentário! Se quiser conhecer melhor nosso trabalho, estamos à disposição.";
      }

      await sendFacebookPublicReply({
        socialAccountId,
        commentId: interaction.externalCommentId,
        message: finalMessage,
      });

      updates.publicReplyText = finalMessage;
      updates.publicReplyMeta = {
        automated: true,
        sentAt: new Date().toISOString(),
        ruleId: matchedRule.id,
      };
      updates.status = "replied";
      executed.push("publicReply");
    }

    if (
      isInstagram &&
      actions.publicReply &&
      publicReplyTemplate &&
      interaction.externalCommentId &&
      !interaction.publicReplyMeta?.automated
    ) {
      await sendInstagramPublicReply({
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
      isFacebook &&
      interaction.externalCommentId &&
      ((actions.privateReply && privateReplyTemplate) || autoDM) &&
      !interaction.privateReplyMeta?.automated
    ) {
      const messageToSend = autoDM || privateReplyTemplate;

      if (messageToSend) {
        await sendFacebookPrivateReply({
          socialAccountId,
          commentId: interaction.externalCommentId,
          message: messageToSend,
        });

        updates.privateReplyText = messageToSend;
        updates.privateReplyMeta = {
          automated: true,
          sentAt: new Date().toISOString(),
          ruleId: matchedRule.id,
        };
        updates.status = "private_replied";
        executed.push("privateReply");
      }
    }

    if (
      isInstagram &&
      interaction.externalCommentId &&
      ((actions.privateReply && privateReplyTemplate) || autoDM) &&
      !interaction.privateReplyMeta?.automated
    ) {
      const messageToSend = autoDM || privateReplyTemplate;

      if (messageToSend) {
        await sendInstagramPrivateReplyFromSocialAccount({
          socialAccountId,
          commentId: interaction.externalCommentId,
          message: messageToSend,
        });

        updates.privateReplyText = messageToSend;
        updates.privateReplyMeta = {
          automated: true,
          sentAt: new Date().toISOString(),
          ruleId: matchedRule.id,
        };
        updates.status = "private_replied";
        executed.push("privateReply");
      }
    }

    if (actions.convertToLead || intentLevel === "high") {
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
          leadName:
            interaction.commenterUsername ||
            (isFacebook ? "Lead Facebook" : "Lead Instagram"),
          instagramUsername: interaction.commenterUsername || "",
          note: interaction.commenterText || "",
          intentLevel: intentLevel || "auto",
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
