// src/types/campaign.ts
export type CampaignChannel = "instagram_dm" | "facebook_dm" | "whatsapp";

export type CampaignStatus =
  | "draft"
  | "queued"
  | "processing"
  | "done"
  | "error";

export type CampaignRiskLevel = "low" | "medium" | "high";

export interface CampaignAudienceFilters {
  temperature?: "cold" | "warm" | "hot" | "priority" | "all";
  followStatus?: "followers" | "non_followers" | "all";
  category?: string | "all";
  operationalTag?: string | "all";
  search?: string;
  onlyNonFollowers?: boolean;
  onlyEngaged?: boolean;
  sentiment?: "positive" | "neutral" | "negative" | "all";
  interactionType?: "like" | "comment" | "view" | "reaction" | "all";
  competitorId?: string | "all";
}

export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  channel: CampaignChannel;
  message: string;
  audienceFilters: CampaignAudienceFilters;
  audienceMode?: "profiles" | "contacts" | "competitor";
  recipientsCount: number;
  status: CampaignStatus;
  riskLevel?: CampaignRiskLevel;
  createdAt: string;
  updatedAt: string;
}
