// src/lib/importProfileToContact.ts
import { upsertContactById } from "@/firebase/contacts";
import type { EngagementProfile } from "@/types/engagementProfile";
import type { Firestore } from "firebase/firestore";

export async function importProfileToContact(firestore: Firestore, profile: EngagementProfile) {
  const now = new Date().toISOString();
  const contactId = `${profile.workspaceId}_${profile.username}`;

  await upsertContactById(firestore, contactId, {
    workspaceId: profile.workspaceId,
    profileId: profile.id,
    socialAccountId: profile.socialAccountId || null,
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar || null,
    phone: profile.phone || null,
    email: profile.email || null,
    network: profile.network || null,
    categories: profile.categories || [],
    interestTags: profile.interestTags || [],
    customTags: profile.customTags || [],
    operationalTags: profile.operationalTags || [],
    leadTemperature: profile.leadTemperature,
    leadScore: profile.leadScore,
    lastInteractionAt: profile.lastInteractionAt || null,
    lastInteractionType: null, // This can be filled later
    lastInteractionText: null, // This can be filled later
    contactStatus: "novo",
    notes: null,
    createdAt: now,
    updatedAt: now,
  });
}
