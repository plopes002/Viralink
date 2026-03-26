// src/lib/competitorAlertActions.ts
export type CompetitorAlertAction =
  | {
      type: "open_campaign";
      label: string;
      payload?: Record<string, any>;
    }
  | {
      type: "generate_content_strategy";
      label: string;
      payload?: Record<string, any>;
    }
  | {
      type: "import_leads_to_crm";
      label: string;
      payload?: Record<string, any>;
    }
  | null;

export function getCompetitorAlertAction(alert: any): CompetitorAlertAction {
  if (!alert?.type) return null;

  if (alert.type === "campaign_opportunity") {
    return {
      type: "open_campaign",
      label: "Criar campanha agora",
      payload: {
        audienceMode: "competitor",
        competitorId: alert.competitorId,
      },
    };
  }

  if (alert.type === "lost_engagement_advantage") {
    return {
      type: "generate_content_strategy",
      label: "Gerar estratégia de conteúdo",
      payload: {
        competitorId: alert.competitorId,
      },
    };
  }

  if (
    alert.type === "competitor_growth_accelerated" ||
    alert.type === "comments_drop" ||
    alert.type === "likes_gap_worsened"
  ) {
    return {
      type: "import_leads_to_crm",
      label: "Adicionar leads ao CRM",
      payload: {
        competitorId: alert.competitorId,
      },
    };
  }

  return null;
}