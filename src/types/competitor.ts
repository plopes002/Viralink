// src/types/competitor.ts
export interface Competitor {
    id: string;
    workspaceId: string;
    createdByUid: string;
    name: string;
    handle: string;
    network: "instagram" | "facebook" | "tiktok" | "youtube";
    profileUrl: string;
    avatarUrl?: string;
    isActive: boolean;
    planIncluded: boolean;
    extraCharge: boolean;
    followers: number;
    following?: number;
    postsTotal?: number;
    avgEngagementRate?: number;
    avgLikesPerPost?: number;
    avgCommentsPerPost?: number;
    postsLast7d?: number;
    followersDelta7d?: number;
    engagementRate7d?: number;
    lastInsightsSyncAt?: string;
    lastAlertAt?: string;
    createdAt: string;
    updatedAt: string;
  }
