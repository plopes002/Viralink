// src/hooks/useCompetitors.ts
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { Competitor } from "@/types/competitor";

export function useCompetitors(workspaceId?: string) {
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
      collection(firestore, "competitors"),
      where("workspaceId", "==", workspaceId),
       orderBy("name", "asc")
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
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { competitors, loading };
}
