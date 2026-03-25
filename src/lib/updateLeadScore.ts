// src/lib/updateLeadScore.ts
import { updateEngagement } from "@/firebase/engagements";
import { calculateLeadScore } from "@/lib/leadScoring";
import type { EngagementItem } from "@/types/engagement";
import type { Firestore } from "firebase/firestore";

export async function updateLeadScoreForEngagement(
  firestore: Firestore,
  item: EngagementItem,
) {
  const result = calculateLeadScore(item);

  await updateEngagement(firestore, item.id, {
    leadScore: result.score,
    leadTemperature: result.temperature,
    leadScoreReason: result.reasons,
  });

  return result;
}
