// src/types/savedCampaignTemplate.ts
import type { CampaignChannel } from "@/types/campaign";
import type { CampaignTemplateType } from "@/types/campaignTemplate";

export interface SavedCampaignTemplate {
  id: string;
  workspaceId: string;

  name: string;
  description?: string | null;

  templateType: CampaignTemplateType;
  channel: CampaignChannel;
  tone?: string | null;
  topic?: string | null;
  audienceDescription?: string | null;

  message: string;

  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}
