// src/types/engagementProfile.ts
import type { LeadTemperature } from "@/types/engagement";

export interface EngagementProfile {
  id: string;

  workspaceId: string;
  socialAccountId: string;

  username: string;
  name: string;
  avatar?: string | null;

  isFollower: boolean;

  phone?: string | null;
  email?: string | null;

  network: "instagram" | "facebook" | "whatsapp";

  categories?: string[];
  interestTags?: string[];
  customTags?: string[];
  operationalTags?: string[];

  totalInteractions: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalReactions: number;
  totalShares: number;
  totalMessages: number;

  positiveCount: number;
  neutralCount: number;
  negativeCount: number;

  distinctPostsCount: number;
  distinctTopicsCount: number;
  lastInteractionAt?: string | null;
  firstInteractionAt?: string | null;

  recurringScore: number;
  leadScore: number;
  leadTemperature: LeadTemperature;
  leadScoreReason?: string[];

  politicalFlags?: string[];
  politicalEntities?: string[];

  createdAt: string;
  updatedAt: string;
}
