// src/lib/competitorAlertDedup.ts
export function buildCompetitorAlertKey(params: {
  competitorId: string;
  type: string;
  periodDays: number;
}) {
  return `${params.competitorId}:${params.type}:${params.periodDays}`; 
}