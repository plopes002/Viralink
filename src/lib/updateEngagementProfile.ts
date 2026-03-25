// src/lib/updateEngagementProfile.ts
import { buildEngagementProfileFromItems } from "@/lib/engagementProfileScoring";
import { getEngagementsByUser, upsertEngagementProfile } from "@/firebase/engagementProfiles";
import type { EngagementItem } from "@/types/engagement";
import type { Firestore } from "firebase/firestore";

export async function updateConsolidatedEngagementProfile(
    firestore: Firestore,
    item: EngagementItem
) {
  const allItems = await getEngagementsByUser(
    firestore,
    item.workspaceId,
    item.socialAccountId,
    item.username,
  );

  if (allItems.length === 0) {
      allItems.push(item);
  }

  const profile = buildEngagementProfileFromItems(allItems);
  await upsertEngagementProfile(firestore, profile);

  return profile;
}
