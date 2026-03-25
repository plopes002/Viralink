// src/types/engagement.ts
export type EngagementInteractionType =
  | "view"
  | "like"
  | "comment"
  | "reaction"
  | "share"
  | "message";

export type EngagementSentiment = "positive" | "neutral" | "negative";

export type EngagementPostType = "text" | "image" | "video" | "carousel";
export type LeadTemperature = "cold" | "warm" | "hot" | "priority";

export interface PoliticalReviewNote {
  hasPoliticalMention: boolean;
  flags: string[];
  entities: string[];
  excerpt?: string | null;
  summary?: string | null;
}

export interface EngagementItem {
  id: string;
  workspaceId: string;
  socialAccountId: string;

  username: string;
  name: string;
  avatar?: string | null;

  isFollower: boolean;

  interactionType: EngagementInteractionType;
  interactionText?: string | null;
  interactionSentiment: EngagementSentiment;

  source: "post" | "story" | "reel" | "direct";

  postId?: string | null;
  postTitle?: string | null;
  postType?: EngagementPostType | null;
  postTopic?: string | null;

  network: "instagram" | "facebook" | "whatsapp";

  phone?: string | null;
  email?: string | null;
  categories?: string[];
  operationalTags?: string[];

  politicalReview?: PoliticalReviewNote | null;
  
  leadScore?: number;
  leadTemperature?: LeadTemperature;
  leadScoreReason?: string[];

  createdAt: string;
}
