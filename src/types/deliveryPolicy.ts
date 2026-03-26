// src/types/deliveryPolicy.ts
export interface DeliveryPolicy {
  channel: "instagram_dm" | "facebook_dm" | "whatsapp";
  maxPerHour: number;
  maxPerDay: number;
  minDelaySeconds: number;
  maxBurst: number;
  quietHoursStart?: number; // 22
  quietHoursEnd?: number;   // 8
  requireHumanReviewForColdLeads: boolean;
}
