// src/types/competitorStrategyHistory.ts
export interface CompetitorStrategyHistoryItem {
  id: string;

  workspaceId: string;
  competitorId: string;

  periodDays: number;

  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];

  suggestedCampaignTitle?: string | null;
  suggestedCampaignMessage?: string | null;

  createdAt: string;
}