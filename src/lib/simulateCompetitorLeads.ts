// src/lib/simulateCompetitorLeads.ts
import { addDoc, collection, Firestore } from "firebase/firestore";

export async function simulateCompetitorLeads(firestore: Firestore, workspaceId: string, competitorId: string) {
  const fakeUsers = [
    { username: "joao_politico", type: "comment", sentiment: "positive" },
    { username: "maria_educadora", type: "like", sentiment: "neutral" },
    { username: "carlos_empreendedor", type: "view", sentiment: "positive" },
    { username: "ana_social", type: "comment", sentiment: "negative" },
  ];

  const now = new Date().toISOString();

  for (const user of fakeUsers) {
    await addDoc(collection(firestore, "competitorLeads"), {
      workspaceId,
      competitorId,
      username: user.username,
      name: user.username,
      isFollower: false,
      hasInteracted: user.type !== "view",
      interactionType: user.type,
      sentiment: user.sentiment,
      extractedAt: now,
    });
  }
}
