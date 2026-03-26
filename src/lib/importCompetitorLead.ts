// src/lib/importCompetitorLead.ts
import { upsertContactById } from "@/firebase/contacts";
import { createContactHistory } from "@/firebase/contactHistory";
import type { CompetitorLead } from "@/types/competitorLead";
import type { Firestore } from "firebase/firestore";

export async function importLeadToCRM(firestore: Firestore, lead: CompetitorLead) {
  const now = new Date().toISOString();
  const contactId = `${lead.workspaceId}_${lead.username}`;

  await upsertContactById(firestore, contactId, {
    workspaceId: lead.workspaceId,
    profileId: null,
    socialAccountId: null,
    name: lead.name || lead.username,
    username: lead.username,
    avatar: null,
    phone: lead.phone || null,
    email: lead.email || null,
    network: "instagram",
    categories: ["concorrente"],
    interestTags: [],
    customTags: [],
    operationalTags: ["lead-concorrente"],
    leadTemperature: lead.hasInteracted ? "warm" : "cold",
    leadScore: lead.hasInteracted ? 20 : 8,
    lastInteractionAt: lead.extractedAt || now,
    lastInteractionType: lead.interactionType || null,
    lastInteractionText: null,
    contactStatus: "novo",
    contactSource: "competitor",
    firstContactAt: now,
    lastContactAt: now,
    responsibleUser: null,
    city: null,
    state: null,
    notes: null,
    detailedNotes: `Lead importado do concorrente ${lead.competitorId}.`,
    createdAt: now,
    updatedAt: now,
  });

  await createContactHistory(firestore, {
    workspaceId: lead.workspaceId,
    contactId,
    type: "profile_imported",
    title: "Lead de concorrente importado",
    description: `Origem: ${lead.competitorId}`,
    metadata: {
      competitorId: lead.competitorId,
      interactionType: lead.interactionType,
      sentiment: lead.sentiment,
    },
    createdAt: now,
  });
}
