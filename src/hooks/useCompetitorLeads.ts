// src/hooks/useCompetitorLeads.ts
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { CompetitorLead } from "@/types/competitorLead";

export function useCompetitorLeads(workspaceId?: string) {
  const { firestore } = useFirebase();
  const [leads, setLeads] = useState<CompetitorLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !firestore) {
      setLeads([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const q = query(
      collection(firestore, "competitorLeads"),
      where("workspaceId", "==", workspaceId),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompetitorLead));
        setLeads(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useCompetitorLeads] erro:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { leads, loading };
}
