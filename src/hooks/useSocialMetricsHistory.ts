// src/hooks/useSocialMetricsHistory.ts
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";

export interface SocialMetricsHistoryItem {
  id: string;
  workspaceId: string;
  entityType: "account" | "competitor";
  entityId: string;
  date: string; // YYYY-MM-DD ou ISO
  followers?: number;
  engagementRate?: number;
  growthRate?: number;
  avgLikes?: number;
  avgComments?: number;
}

export function useSocialMetricsHistory(
  workspaceId?: string,
  entityType?: "account" | "competitor",
  entityId?: string | null,
) {
  const { firestore } = useFirebase();
  const [history, setHistory] = useState<SocialMetricsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !entityType || !entityId || !firestore) {
      setHistory([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const q = query(
      collection(firestore, "socialMetricsHistory"),
      where("workspaceId", "==", workspaceId),
      where("entityType", "==", entityType),
      where("entityId", "==", entityId),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as SocialMetricsHistoryItem[];

        docs.sort((a, b) => String(a.date).localeCompare(String(b.date)));
        setHistory(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useSocialMetricsHistory] erro:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, entityType, entityId, firestore]);

  return { history, loading };
}
