// src/hooks/useEngagements.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { EngagementItem } from "@/types/engagement";

export function useEngagements(workspaceId?: string) {
  const { firestore } = useFirebase();
  const [engagements, setEngagements] = useState<EngagementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !firestore) {
      setEngagements([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const colRef = collection(firestore, "engagements");
    const q = query(
      colRef,
      where("workspaceId", "==", workspaceId),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: EngagementItem[] = snap.docs.map((d) => {
          const data = d.data() as any;

          return {
            id: d.id,
            workspaceId: data.workspaceId || "",
            socialAccountId: data.socialAccountId || "",
            username: data.username || "",
            name: data.name || data.username || "Sem nome",
            phone: data.phone || null,

            source: data.source || "manual",
            network: data.network || "instagram",

            interactionType: data.interactionType || "comment",
            interactionText: data.interactionText || "",
            interactionSentiment: data.interactionSentiment || "neutral",

            isFollower: Boolean(data.isFollower),

            postId: data.postId || null,
            postTitle: data.postTitle || "",
            postTopic: data.postTopic || "",
            postType: data.postType || "",

            categories: Array.isArray(data.categories) ? data.categories : [],
            operationalTags: Array.isArray(data.operationalTags)
              ? data.operationalTags
              : [],

            politicalReview: data.politicalReview || null,

            leadScore:
              typeof data.leadScore === "number" ? data.leadScore : null,
            leadTemperature: data.leadTemperature || "cold",
            leadScoreReason: Array.isArray(data.leadScoreReason)
              ? data.leadScoreReason
              : [],

            createdAt: data.createdAt || "",
            updatedAt: data.updatedAt || "",
          };
        });

        setEngagements(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useEngagements] erro:", err);
        setEngagements([]);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { engagements, loading };
}