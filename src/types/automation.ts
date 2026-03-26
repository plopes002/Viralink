// src/types/automation.ts

export type AutomationTrigger =
  | "new_follower"
  | "new_comment"
  | "new_message"
  | "new_reaction"
  | "competitor_lead";

export type AutomationChannel = "instagram_dm" | "facebook_dm" | "whatsapp";

interface BaseAutomationRule {
  id?: string;
  workspaceId: string;
  name: string;
  active: boolean;
  trigger: AutomationTrigger;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface SocialAccountAutomationRule extends BaseAutomationRule {
  trigger: "new_follower" | "new_comment" | "new_message" | "new_reaction";
  network: "instagram" | "facebook" | "whatsapp";
  socialAccountId: string;
  actionChannel: AutomationChannel;
  messageTemplateId: string;
  conditions?: {
    containsKeyword?: string;
    minFollowers?: number;
  };
}

export interface CompetitorLeadAutomationRule extends BaseAutomationRule {
  trigger: "competitor_lead";
  conditions: {
    onlyNonFollowers?: boolean;
    onlyEngaged?: boolean;
    sentiment?: "positive" | "neutral" | "negative";
    interactionType?: "like" | "comment" | "view";
  };
  action: {
    type: "send_message" | "add_to_crm";
    message?: string;
  };
}

export type AutomationRule = SocialAccountAutomationRule | CompetitorLeadAutomationRule;
