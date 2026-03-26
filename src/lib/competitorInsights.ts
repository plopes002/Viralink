// src/lib/competitorInsights.ts
export function generateCompetitorInsights({
  my,
  competitor,
}: {
  my: any;
  competitor: any;
}) {
  const insights: string[] = [];

  if (competitor.followers > my.followers) {
    insights.push("O concorrente possui maior base de seguidores.");
  } else if (my.followers > competitor.followers) {
    insights.push("Sua conta possui maior base de seguidores.");
  }

  if (competitor.growthRate > my.growthRate) {
    insights.push("O concorrente está crescendo mais rápido.");
  } else if (my.growthRate > competitor.growthRate) {
    insights.push("Sua conta está crescendo mais rápido.");
  }

  if (my.engagementRate > competitor.engagementRate) {
    insights.push("Sua taxa de engajamento é superior.");
  } else if (competitor.engagementRate > my.engagementRate) {
    insights.push("O concorrente possui maior engajamento.");
  }

  if (my.avgComments > competitor.avgComments) {
    insights.push("Sua conta gera mais comentários (maior interação real).");
  } else if (competitor.avgComments > my.avgComments) {
    insights.push("O concorrente gera mais comentários.");
  }

  if (my.avgLikes > competitor.avgLikes) {
    insights.push("Seu conteúdo recebe mais curtidas.");
  } else if (competitor.avgLikes > my.avgLikes) {
    insights.push("O concorrente recebe mais curtidas.");
  }

  return insights;
}

export function generateSummary(insights: string[]) {
  if (!insights.length) return "Não há dados suficientes para análise.";

  return insights.join(" ");
}
