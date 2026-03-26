// src/types/competitorLead.ts
export interface CompetitorLead {
  id: string;
  workspaceId: string;

  competitorId: string;

  username: string;
  name?: string;

  isFollower: boolean;
  hasInteracted: boolean;

  interactionType?: "like" | "comment" | "view";

  sentiment?: "positive" | "neutral" | "negative";

  extractedAt: string;
}
