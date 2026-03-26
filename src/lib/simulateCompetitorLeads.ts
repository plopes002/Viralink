// src/lib/simulateCompetitorLeads.ts
import { addDoc, collection, Firestore } from "firebase/firestore";
import { processCompetitorLead } from "./automationEngine";
import type { CompetitorLead } from "@/types/competitorLead";

export async function simulateCompetitorLeads(firestore: Firestore, workspaceId: string, competitorId: string) {
  const fakeUsers = [
    { username: "joao_politico", type: "comment", sentiment: "positive" },
    { username: "maria_educadora", type: "like", sentiment: "neutral" },
    { username: "carlos_empreendedor", type: "view", sentiment: "positive" },
    { username: "ana_social", type: "comment", sentiment: "negative" },
  ];

  const now = new Date().toISOString();

  for (const user of fakeUsers) {
    const leadData: Omit<CompetitorLead, 'id'> = {
      workspaceId,
      competitorId,
      username: user.username,
      name: user.username,
      isFollower: false,
      hasInteracted: user.type !== "view",
      interactionType: user.type as any,
      sentiment: user.sentiment as any,
      extractedAt: now,
    };

    const docRef = await addDoc(collection(firestore, "competitorLeads"), leadData);

    // Trigger automation engine for the newly created lead
    await processCompetitorLead(firestore, { id: docRef.id, ...leadData });
  }
}
