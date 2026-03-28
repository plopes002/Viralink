// src/types/socialAccount.ts
export type SocialNetwork = "instagram" | "facebook" | "whatsapp";

export interface SocialAccount {
  id: string;
  workspaceId: string;
  network: SocialNetwork;
  name: string;
  username?: string | null;
  accountId: string; // The ID from the social network
  status: "connected" | "expired" | "disconnected";
  isPrimary?: boolean;
  followers?: number;
  engagementRate?: number;
  growthRate?: number;
  avgLikes?: number;
  avgComments?: number;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string | null;
  accessToken?: string | null;
  pageAccessToken?: string | null;
}
