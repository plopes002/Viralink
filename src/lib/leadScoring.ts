// src/lib/leadScoring.ts
import type {
  EngagementItem,
  EngagementInteractionType,
  LeadTemperature,
} from "@/types/engagement";

function interactionBaseScore(type: EngagementInteractionType): number {
  switch (type) {
    case "view":
      return 2;
    case "like":
      return 5;
    case "reaction":
      return 7;
    case "comment":
      return 12;
    case "share":
      return 15;
    case "message":
      return 30;
    default:
      return 0;
  }
}

export function calculateLeadScore(item: EngagementItem): {
  score: number;
  temperature: LeadTemperature;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  const base = interactionBaseScore(item.interactionType);
  score += base;
  reasons.push(`Interação ${item.interactionType}: +${base}`);

  if (!item.isFollower && item.interactionType !== "view") {
    score += 8;
    reasons.push("Não segue, mas interagiu: +8");
  }

  if (item.interactionSentiment === "positive") {
    score += 6;
    reasons.push("Sentimento positivo: +6");
  }

  if (item.interactionSentiment === "negative") {
    score -= 4;
    reasons.push("Sentimento negativo: -4");
  }

  if (item.phone) {
    score += 10;
    reasons.push("Contato com telefone: +10");
  }

  if (item.email) {
    score += 5;
    reasons.push("Contato com e-mail: +5");
  }

  const tags = item.operationalTags || [];

  if (tags.includes("prioridade-alta")) {
    score += 20;
    reasons.push("Tag prioridade-alta: +20");
  }

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

  if (item.postTopic) {
    const strategicTopics = [
      "engajamento",
      "vendas",
      "educacao",
      "seguranca",
      "saude",
      "politica",
      "mobilizacao",
    ];

    if (strategicTopics.includes(item.postTopic.toLowerCase())) {
      score += 5;
      reasons.push(`Tema estratégico (${item.postTopic}): +5`);
    }
  }

  const temperature = classifyLeadTemperature(score);

  return {
    score,
    temperature,
    reasons,
  };
}

export function classifyLeadTemperature(score: number): LeadTemperature {
  if (score >= 50) return "priority";
  if (score >= 30) return "hot";
  if (score >= 15) return "warm";
  return "cold";
}
