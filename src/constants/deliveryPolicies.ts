// src/constants/deliveryPolicies.ts
import type { DeliveryPolicy } from "@/types/deliveryPolicy";

export const DELIVERY_POLICIES: Record<string, DeliveryPolicy> = {
  instagram_dm: {
    channel: "instagram_dm",
    maxPerHour: 20,
    maxPerDay: 80,
    minDelaySeconds: 90,
    maxBurst: 3,
    quietHoursStart: 22,
    quietHoursEnd: 8,
    requireHumanReviewForColdLeads: true,
  },
  facebook_dm: {
    channel: "facebook_dm",
    maxPerHour: 20,
    maxPerDay: 80,
    minDelaySeconds: 90,
    maxBurst: 3,
    quietHoursStart: 22,
    quietHoursEnd: 8,
    requireHumanReviewForColdLeads: true,
  },
  whatsapp: {
    channel: "whatsapp",
    maxPerHour: 30,
    maxPerDay: 120,
    minDelaySeconds: 60,
    maxBurst: 5,
    quietHoursStart: 22,
    quietHoursEnd: 8,
    requireHumanReviewForColdLeads: false,
  },
};
