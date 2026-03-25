// src/lib/analyzePoliticalReview.ts
import { updateEngagement } from "@/firebase/engagements";
import type { EngagementItem, PoliticalReviewNote } from "@/types/engagement";
import type { Firestore } from 'firebase/firestore';

export async function analyzePoliticalReviewAndSave(firestore: Firestore, item: EngagementItem): Promise<PoliticalReviewNote | null> {
  const textBase = [
    item.interactionText || "",
    item.postTitle || "",
    item.postTopic || "",
    item.username || "",
    item.name || "",
  ]
    .filter(Boolean)
    .join(" | ");

  if (!textBase.trim()) return null;

  try {
    const res = await fetch("/api/engagement/political-review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: textBase }),
    });

    const data = await res.json();

    const politicalReview: PoliticalReviewNote = {
      hasPoliticalMention: !!data?.hasPoliticalMention,
      flags: Array.isArray(data?.flags) ? data.flags : [],
      entities: Array.isArray(data?.entities) ? data.entities : [],
      excerpt: data?.excerpt || "",
      summary: data?.summary || "",
    };

    await updateEngagement(firestore, item.id, { politicalReview });

    return politicalReview;
  } catch (err) {
    console.error("[analyzePoliticalReviewAndSave] erro:", err);
    return null;
  }
}
