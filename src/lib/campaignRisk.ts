// src/lib/campaignRisk.ts
export function calculateCampaignRisk(params: {
  recipientsCount: number;
  channel: string;
  audienceMode: "profiles" | "contacts" | "competitor";
  hasColdLeads: boolean;
  hasNonFollowers: boolean;
}) {
  let risk = 0;

  if (params.recipientsCount > 50) risk += 30;
  if (params.audienceMode === "competitor") risk += 25;
  if (params.hasColdLeads) risk += 20;
  if (params.hasNonFollowers) risk += 10;

  if (risk >= 60) return "high";
  if (risk >= 30) return "medium";
  return "low";
}
