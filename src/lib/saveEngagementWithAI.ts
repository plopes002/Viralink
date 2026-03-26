// src/lib/saveEngagementWithAI.ts
import { createEngagement } from "@/firebase/engagements";
import { enqueueJob } from "@/firebase/processingQueue";
import type { EngagementItem } from "@/types/engagement";
import type { Firestore } from "firebase/firestore";

export async function saveEngagementWithAI(
  firestore: Firestore,
  payload: Omit<EngagementItem, "id" | "interactionSentiment">,
) {
  const defaultSentiment =
    payload.interactionType === "like" ||
    payload.interactionType === "reaction" ||
    payload.interactionType === "share"
      ? "positive"
      : "neutral";

  const engagementId = await createEngagement(firestore, {
    ...payload,
    interactionSentiment: defaultSentiment,
  });

  // Fila para análise de sentimento
  if (
    payload.interactionType === "comment" ||
    payload.interactionType === "message"
  ) {
    await enqueueJob(firestore, {
      type: "engagement_sentiment_analysis",
      workspaceId: payload.workspaceId,
      engagementId,
      payload: {
        socialAccountId: payload.socialAccountId,
        username: payload.username,
      },
    });
  }

  // Fila para sugestão de categorias
  await enqueueJob(firestore, {
    type: "engagement_category_suggestion",
    workspaceId: payload.workspaceId,
    engagementId,
    payload: {
      socialAccountId: payload.socialAccountId,
      username: payload.username,
    },
  });

  // Fila para revisão de menções políticas
  await enqueueJob(firestore, {
    type: "engagement_political_review",
    workspaceId: payload.workspaceId,
    engagementId,
    payload: {
      socialAccountId: payload.socialAccountId,
      username: payload.username,
    },
  });

  // Fila para consolidar o perfil do usuário
  await enqueueJob(firestore, {
    type: "engagement_profile_update",
    workspaceId: payload.workspaceId,
    engagementId,
    payload: {
      socialAccountId: payload.socialAccountId,
      username: payload.username,
    },
  });

  return engagementId;
}
