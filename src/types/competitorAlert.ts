// src/types/competitorAlert.ts
export type CompetitorAlertSeverity = "info" | "warning" | "critical";

export type CompetitorAlertType =
  | "competitor_growth_accelerated"
  | "lost_engagement_advantage"
  | "campaign_opportunity"
  | "comments_drop"
  | "likes_gap_worsened";

export interface CompetitorAlertItem {
  id: string;
  workspaceId: string;
  competitorId: string;

  type: CompetitorAlertType;
  severity: CompetitorAlertSeverity;

  title: string;
  description: string;

  periodDays: number;
  isRead: