// src/lib/scheduleMessages.ts
import { DELIVERY_POLICIES } from "@/constants/deliveryPolicies";
import { isQuietHours } from './deliveryGuards';

export function scheduleMessageTime(params: {
  channel: "instagram_dm" | "facebook_dm" | "whatsapp";
  index: number;
  fromDate?: Date;
}) {
  const { channel, index } = params;
  const from = params.fromDate || new Date();
  const policy = DELIVERY_POLICIES[channel];

  let scheduled = new Date(from.getTime() + index * policy.minDelaySeconds * 1000);

  // Check for quiet hours and adjust if necessary
  if (policy.quietHoursStart !== undefined && policy.quietHoursEnd !== undefined) {
    while (isQuietHours(scheduled, policy.quietHoursStart, policy.quietHoursEnd)) {
      // If it's in quiet hours, push it to the end of the quiet period
      const quietEndHour = policy.quietHoursEnd;
      const nextAvailableTime = new Date(scheduled);
      
      if (scheduled.getHours() >= policy.quietHoursStart) {
        // It's tonight, so schedule for tomorrow morning
        nextAvailableTime.setDate(nextAvailableTime.getDate() + 1);
      }
      
      nextAvailableTime.setHours(quietEndHour, 0, 0, 0); // Set to start of next available slot
      scheduled = new Date(nextAvailableTime.getTime() + (index * 15 * 1000)); // add a small jitter
    }
  }


  return scheduled.toISOString();
}
