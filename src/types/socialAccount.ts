// src/types/socialAccount.ts
export type SocialNetwork = "instagram" | "facebook" | "whatsapp";

export interface SocialAccount {
  id: string;
  workspaceId: string;
  network: SocialNetwork;
  name: string; // was displayName
  username?: string | null;
  accountId: string;
  status: "connected" | "expired" | "disconnected";
  isPrimary?: boolean;
  followers?: number;
  engagementRate?: number;
  growthRate?: number;
  avgLikes?: number;
  avgComments?: number;
  createdAt: string;
  updatedAt: string;
}
