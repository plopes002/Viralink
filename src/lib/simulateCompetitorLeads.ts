// src/lib/simulateCompetitorLeads.ts
import { addDoc, collection, Firestore } from "firebase/firestore";
import { processCompetitorLead } from "./automationEngine";
import type { CompetitorLead } from "@/types/competitorLead";

export async function simulateCompetitorLeads(
  firestore: Firestore,
  workspaceId: string,
  competitorId: string,
) {
  const fakeUsers = [
    {
      username: "joao_politico",
      name: "João Político",
      type: "comment",
      sentiment: "positive",
    },
    {
      username: "maria_educadora",
      name: "Maria Educadora",
      type: "like",
      sentiment: "neutral",
    },
    {
      username: "carlos_empreendedor",
      name: "Carlos Empreendedor",
      type: "view",
      sentiment: "positive",
    },
    {
      username: "ana_social",
      name: "Ana Social",
      type: "comment",
      sentiment: "negative",
    },
  ];

  const now = new Date().toISOString();

  for (const user of fakeUsers) {
    const leadData: Omit<CompetitorLead, "id"> = {
      workspaceId,
      competitorId,
      username: user.username,
      name: user.name,
      isFollower: false,
      hasInteracted: user.type !== "view",
      interactionType: user.type as any,
      sentiment: user.sentiment as any,
      extractedAt: now,
    };
    const docRef = await addDoc(collection(firestore, "competitorLeads"), leadData);

    await processCompetitorLead(firestore, { id: docRef.id, ...leadData });
  }
}
