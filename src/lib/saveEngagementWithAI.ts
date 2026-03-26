// src/lib/saveEngagementWithAI.ts
import { createEngagement } from "@/firebase/engagements";
import { updateConsolidatedEngagementProfile } from "@/lib/updateEngagementProfile";
import type { EngagementItem } from "@/types/engagement";
import type { Firestore } from 'firebase/firestore';

export async function saveEngagementWithAI(
  firestore: Firestore,
  payload: Omit<EngagementItem, "id" | "interactionSentiment">,
) {
  let sentiment: "positive" | "neutral" | "negative" = "neutral";

  const shouldAnalyze =
    payload.interactionType === "comment" ||
    payload.interactionType === "message";

  if (shouldAnalyze && payload.interactionText) {
    try {
      const res = await fetch("/api/engagement/analyze-sentiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: payload.interactionText,
        }),
      });

      const data = await res.json();
      if (data?.sentiment) {
        sentiment = data.sentiment;
      }
    } catch (err) {
      console.error("Erro sentimento:", err);
    }
  } else {
    sentiment =
      payload.interactionType === "like" ||
      payload.interactionType === "reaction" ||
      payload.interactionType === "share"
        ? "positive"
        : "neutral";
  }

  // 1️⃣ salva o engagement
  const id = await createEngagement(firestore, {
    ...payload,
    interactionSentiment: sentiment,
  });

  // 2️⃣ 🔥 TRIGGER AUTOMÁTICO DO PERFIL CONSOLIDADO
  try {
    await updateConsolidatedEngagementProfile(firestore, {
      ...payload,
      id,
      interactionSentiment: sentiment,
    } as any);
  } catch (err) {
    console.error("[AUTO PROFILE UPDATE ERROR]", err);
  }

  return id;
}
