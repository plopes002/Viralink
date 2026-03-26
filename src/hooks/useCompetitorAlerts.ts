// src/hooks/useCompetitorAlerts.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { CompetitorAlertItem } from "@/types/competitorAlert";

export function useCompetitorAlerts(
  workspaceId?: string,
  competitorId?: string | null,
) {
  const { firestore } = useFirebase();
  const [alerts, setAlerts] = useState<CompetitorAlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !firestore) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const constraints = [
        where("workspaceId", "==", workspaceId),
    ];

    if (competitorId) {
        constraints.push(where("competitorId", "==", competitorId))
    }

    const q = query(
      collection(firestore, "competitorAlerts"),
      ...constraints,
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as CompetitorAlertItem[];
        setAlerts(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useCompetitorAlerts] erro:", err);
        setAlerts([]);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, competitorId, firestore]);

  return { alerts, loading };
}
