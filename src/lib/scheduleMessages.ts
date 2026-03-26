// src/lib/scheduleMessages.ts
import { DELIVERY_POLICIES } from "@/constants/deliveryPolicies";

function moveToAllowedWindow(date: Date, quietStart = 22, quietEnd = 8) {
  const adjusted = new Date(date);
  const hour = adjusted.getHours();

  const inQuietHours =
    quietStart > quietEnd
      ? hour >= quietStart || hour < quietEnd
      : hour >= quietStart && hour < quietEnd;

  if (!inQuietHours) return adjusted;

  if (hour >= quietStart) {
    adjusted.setDate(adjusted.getDate() + 1);
  }

  adjusted.setHours(quietEnd, 0, 0, 0);
  return adjusted;
}

export function scheduleMessageTime(params: {
  channel: "instagram_dm" | "facebook_dm" | "whatsapp";
  index: number;
  fromDate?: Date;
}) {
  const { channel, index } = params;
  const base = params.fromDate || new Date();
  const policy = DELIVERY_POLICIES[channel];

  const scheduled = new Date(
    base.getTime() + index * policy.minDelaySeconds * 1000,
  );

  const adjusted = moveToAllowedWindow(
    scheduled,
    policy.quietHoursStart,
    policy.quietHoursEnd,
  );

  return adjusted.toISOString();
}
