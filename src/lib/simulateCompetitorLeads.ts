// src/lib/simulateCompetitorLeads.ts
import { addDoc, collection, Firestore } from "firebase/firestore";

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
    await addDoc(collection(firestore, "competitorLeads"), {
      workspaceId,
      competitorId,
      username: user.username,
      name: user.name,
      isFollower: false,
      hasInteracted: user.type !== "view",
      interactionType: user.type,
      sentiment: user.sentiment,
      extractedAt: now,
    });
  }
}
