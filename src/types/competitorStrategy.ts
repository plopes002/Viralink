// src/types/competitorStrategy.ts
import { z } from 'zod';

export const CompetitorStrategyResultSchema = z.object({
  summary: z.string().describe("Resumo geral curto da análise estratégica."),
  strengths: z.array(z.string()).describe("Lista de pontos fortes da conta principal em relação ao concorrente."),
  weaknesses: z.array(z.string()).describe("Lista de pontos fracos da conta principal em relação ao concorrente."),
  opportunities: z.array(z.string()).describe("Lista de oportunidades de melhoria ou ação baseadas na análise."),
  recommendations: z.array(z.string()).describe("Lista de ações práticas e recomendadas."),
  suggestedCampaignTitle: z.string().nullish().describe("Um título curto e sugerido para uma campanha de marketing baseada na análise."),
  suggestedCampaignMessage: z.string().nullish().describe("Um texto de exemplo para uma mensagem de campanha baseada na análise."),
});

export type CompetitorStrategyResult = z.infer<typeof CompetitorStrategyResultSchema>;