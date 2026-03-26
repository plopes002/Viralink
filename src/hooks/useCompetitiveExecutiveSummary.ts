// src/hooks/useCompetitiveExecutiveSummary.ts
"use client";

import { useMemo } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useCompetitorAlerts } from "@/hooks/useCompetitorAlerts";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useMessages } from "@/hooks/useMessages";

export function useCompetitiveExecutiveSummary(
  competitorId?: string | null,
) {
  const { currentWorkspace } = useWorkspace() as any;
  const workspaceId = currentWorkspace?.id;

  const { alerts = [] } = useCompetitorAlerts(workspaceId, competitorId);
  const { campaigns = [] } = useCampaigns(workspaceId);
  const { messages = [] } = useMessages(workspaceId);

  return useMemo(() => {
    const unreadCriticalAlerts = alerts.filter(
      (a) => !a.isRead && a.severity === "critical",
    );

    const unreadWarningAlerts = alerts.filter(
      (a) => !a.isRead && a.severity === "warning",
    );

    const suggestedCampaignAlerts = alerts.filter(
      (a) => a.type === "campaign_opportunity" && !a.isRead,
    );

    const pendingReviews = messages.filter(
      (m) => m.status === "awaiting_review",
    );

    const campaignsWithError = campaigns.filter((c) => c.status === "error");

    return {
      unreadCriticalAlerts,
      unreadWarningAlerts,
      suggestedCampaignAlerts,
      pendingReviews,
      campaignsWithError,
      criticalCount: unreadCriticalAlerts.length,
      warningCount: unreadWarningAlerts.length,
      suggestedCampaignsCount: suggestedCampaignAlerts.length,
      pendingReviewsCount: pendingReviews.length,
      campaignErrorsCount: campaignsWithError.length,
    };
  }, [alerts, campaigns, messages]);
}
