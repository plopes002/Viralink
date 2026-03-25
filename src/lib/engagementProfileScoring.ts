// src/lib/engagementProfileScoring.ts
import type { EngagementItem, LeadTemperature } from "@/types/engagement";
import type { EngagementProfile } from "@/types/engagementProfile";

function classifyLeadTemperature(score: number): LeadTemperature {
  if (score >= 80) return "priority";
  if (score >= 50) return "hot";
  if (score >= 25) return "warm";
  return "cold";
}

export function buildEngagementProfileFromItems(
  items: EngagementItem[],
): Omit<EngagementProfile, "id" | "createdAt" | "updatedAt"> {
  if (!items.length) {
    throw new Error("Nenhum engajamento informado para consolidar perfil.");
  }

  const base = items[0];

  const distinctPosts = new Set(
    items.map((i) => i.postId).filter(Boolean),
  );

  const distinctTopics = new Set(
    items.map((i) => i.postTopic).filter(Boolean),
  );

  const totalViews = items.filter((i) => i.interactionType === "view").length;
  const totalLikes = items.filter((i) => i.interactionType === "like").length;
  const totalComments = items.filter((i) => i.interactionType === "comment").length;
  const totalReactions = items.filter((i) => i.interactionType === "reaction").length;
  const totalShares = items.filter((i) => i.interactionType === "share").length;
  const totalMessages = items.filter((i) => i.interactionType === "message").length;

  const positiveCount = items.filter((i) => i.interactionSentiment === "positive").length;
  const neutralCount = items.filter((i) => i.interactionSentiment === "neutral").length;
  const negativeCount = items.filter((i) => i.interactionSentiment === "negative").length;

  const orderedDates = items
    .map((i) => i.createdAt)
    .filter(Boolean)
    .sort();

  const firstInteractionAt = orderedDates[0] || null;
  const lastInteractionAt = orderedDates[orderedDates.length - 1] || null;

  let score = 0;
  const reasons: string[] = [];

  const totalInteractions = items.length;

  if (totalInteractions <= 2) {
    score += 5;
    reasons.push("Até 2 interações: +5");
  } else if (totalInteractions <= 5) {
    score += 12;
    reasons.push("Entre 3 e 5 interações: +12");
  } else if (totalInteractions <= 10) {
    score += 20;
    reasons.push("Entre 6 e 10 interações: +20");
  } else {
    score += 30;
    reasons.push("Mais de 10 interações: +30");
  }

  score += totalComments * 4;
  if (totalComments) reasons.push(`Comentários (${totalComments}): +${totalComments * 4}`);

  score += totalMessages * 10;
  if (totalMessages) reasons.push(`Mensagens (${totalMessages}): +${totalMessages * 10}`);

  score += totalShares * 6;
  if (totalShares) reasons.push(`Compartilhamentos (${totalShares}): +${totalShares * 6}`);

  score += totalLikes * 1;
  if (totalLikes) reasons.push(`Curtidas (${totalLikes}): +${totalLikes}`);

  score += totalReactions * 2;
  if (totalReactions) reasons.push(`Reações (${totalReactions}): +${totalReactions * 2}`);

  if (positiveCount > negativeCount && positiveCount > 0) {
    score += 10;
    reasons.push("Predominância de sentimento positivo: +10");
  }

  if (negativeCount > positiveCount && negativeCount > 0) {
    score -= 5;
    reasons.push("Predominância de sentimento negativo: -5");
  }

  if (distinctTopics.size > 1) {
    score += 8;
    reasons.push(`Interação em múltiplos temas (${distinctTopics.size}): +8`);
  }

  if (distinctPosts.size > 3) {
    score += 10;
    reasons.push(`Interação em múltiplos posts (${distinctPosts.size}): +10`);
  }

  if (!base.isFollower && totalInteractions >= 2) {
    score += 12;
    reasons.push("Não segue, mas interage repetidamente: +12");
  }

  if (base.phone) {
    score += 12;
    reasons.push("Contato com telefone: +12");
  }

  if (base.email) {
    score += 6;
    reasons.push("Contato com e-mail: +6");
  }

  const tags = base.operationalTags || [];

  if (tags.includes("eleitor-potencial")) {
    score += 15;
    reasons.push("Tag eleitor-potencial: +15");
  }

  if (tags.includes("mobilizacao")) {
    score += 12;
    reasons.push("Tag mobilizacao: +12");
  }

  if (tags.includes("apoio-forte")) {
    score += 18;
    reasons.push("Tag apoio-forte: +18");
  }

  if (tags.includes("prioridade-alta")) {
    score += 20;
    reasons.push("Tag prioridade-alta: +20");
  }

  const recurringScore =
    totalInteractions +
    distinctPosts.size +
    distinctTopics.size +
    totalMessages * 2;

  const leadTemperature = classifyLeadTemperature(score);

  return {
    workspaceId: base.workspaceId,
    socialAccountId: base.socialAccountId,
    username: base.username,
    name: base.name,
    avatar: base.avatar || null,
    isFollower: base.isFollower,
    phone: base.phone || null,
    email: base.email || null,
    network: base.network,
    categories: base.categories || [],
    interestTags: base.interestTags || [],
    customTags: base.customTags || [],
    operationalTags: base.operationalTags || [],
    totalInteractions,
    totalViews,
    totalLikes,
    totalComments,
    totalReactions,
    totalShares,
    totalMessages,
    positiveCount,
    neutralCount,
    negativeCount,
    distinctPostsCount: distinctPosts.size,
    distinctTopicsCount: distinctTopics.size,
    firstInteractionAt,
    lastInteractionAt,
    recurringScore,
    leadScore: score,
    leadTemperature,
    leadScoreReason: reasons,
    politicalFlags: base.politicalReview?.flags || [],
    politicalEntities: base.politicalReview?.entities || [],
  };
}
