// src/hooks/useCompetitors.ts
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
import type { Competitor } from "@/types/competitor";

export function useCompetitors(workspaceId?: string | null) {
  const { firestore } = useFirebase();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !firestore) {
      setCompetitors([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(firestore, "competitorAccounts"),
      where("workspaceId", "==", workspaceId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as Competitor[];

        setCompetitors(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useCompetitors] erro:", err);
        setCompetitors([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return {
    competitors,
    loading,
    reload: async () => {
      // no-op: o onSnapshot já mantém em tempo real
      return;
    },
  };
}