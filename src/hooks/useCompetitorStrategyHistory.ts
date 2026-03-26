// src/hooks/useCompetitorStrategyHistory.ts
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { CompetitorStrategyHistoryItem } from "@/types/competitorStrategyHistory";

export function useCompetitorStrategyHistory(
  workspaceId?: string,
  competitorId?: string | null,
) {
  const { firestore } = useFirebase();
  const [history, setHistory] = useState<CompetitorStrategyHistoryItem[]>([]);

  useEffect(() => {
    if (!workspaceId || !competitorId || !firestore) {
        setHistory([]);
        return;
    };

    const q = query(
      collection(firestore, "competitorStrategyHistory"),
      where("workspaceId", "==", workspaceId),
      where("competitorId", "==", competitorId),
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as CompetitorStrategyHistoryItem[];

      docs.sort((a, b) =>
        String(b.createdAt).localeCompare(String(a.createdAt)),
      );

      setHistory(docs);
    });

    return () => unsub();
  }, [workspaceId, competitorId, firestore]);

  return { history };
}
