// src/types/campaignTemplate.ts
export type CampaignTemplateType =
  | "aproximacao"
  | "recuperacao"
  | "mobilizacao"
  | "convite"
  | "conversao"
  | "critica_escuta";

export interface CampaignTemplateSuggestion {
  type: CampaignTemplateType;
  title: string;
  description: string;
  generatedMessage: string;
}
