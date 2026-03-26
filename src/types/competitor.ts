// src/types/competitor.ts
export interface Competitor {
  id: string;
  workspaceId: string;
  name: string;
  username?: string | null;
  platform?: "instagram" | "facebook" | "tiktok" | "youtube" | null;
  followers?: number;
  engagementRate?: number;
  growthRate?: number;
  avgLikes?: number;
  avgComments?: number;
  createdAt?: string;
  updatedAt?: string;
}
