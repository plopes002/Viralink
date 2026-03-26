// src/lib/importProfileToContact.ts
import { upsertContactById } from "@/firebase/contacts";
import { createContactHistory } from "@/firebase/contactHistory";
import type { EngagementProfile } from "@/types/engagementProfile";
import type { ContactSource } from "@/types/contact";
import type { Firestore } from "firebase/firestore";

export async function importProfileToContact(
  firestore: Firestore,
  profile: EngagementProfile,
  source: ContactSource = "manual",
) {
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
    lastInteractionType: null,
    lastInteractionText: null,
    contactStatus: "novo",
    contactSource: source,
    firstContactAt: now,
    lastContactAt: now,
    responsibleUser: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  });

  await createContactHistory(firestore, {
    workspaceId: profile.workspaceId,
    contactId,
    type: "profile_imported",
    title: "Contato importado para o CRM",
    description: `Origem: ${source}`,
    metadata: {
      profileId: profile.id,
      source,
      username: profile.username,
    },
    createdAt: now,
  });
}
