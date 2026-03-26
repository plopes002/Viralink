// src/types/campaign.ts
export type CampaignChannel = "instagram_dm" | "facebook_dm" | "whatsapp";

export type CampaignStatus =
  | "draft"
  | "queued"
  | "processing"
  | "done"
  | "error";

export interface CampaignAudienceFilters {
  temperature?: "cold" | "warm" | "hot" | "priority" | "all";
  followStatus?: "followers" | "non_followers" | "all";
  category?: string | "all";
  operationalTag?: string | "all";
  search?: string;
}

export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  channel: CampaignChannel;
  message: string;
  audienceFilters: CampaignAudienceFilters;
  recipientsCount: number;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}
