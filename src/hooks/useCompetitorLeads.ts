// src/hooks/useCompetitorLeads.ts
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { CompetitorLead } from "@/types/competitorLead";

export function useCompetitorLeads(
  workspaceId?: string,
  competitorId?: string | null,
) {
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

    const baseRef = collection(firestore, "competitorLeads");
    let q;
    if (competitorId) {
       q = query(
          baseRef,
          where("workspaceId", "==", workspaceId),
          where("competitorId", "==", competitorId),
          orderBy("extractedAt", "desc")
        )
    } else {
       q = query(
        baseRef,
        where("workspaceId", "==", workspaceId),
        orderBy("extractedAt", "desc")
      )
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as CompetitorLead[];
        setLeads(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useCompetitorLeads] erro:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, competitorId, firestore]);

  return { leads, loading };
}
