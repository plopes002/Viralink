// src/types/competitorLead.ts
export interface CompetitorLead {
  id: string;
  workspaceId: string;
  competitorId: string;

  username: string;
  name?: string | null;

  isFollower: boolean;
  hasInteracted: boolean;

  interactionType?: "like" | "comment" | "view" | "reaction" | null;
  sentiment?: "positive" | "neutral" | "negative" | null;

  phone?: string | null;
  email?: string | null;

  extractedAt: string;
}
