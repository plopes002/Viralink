// src/hooks/useCompetitorLeads.ts
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { CompetitorLead } from "@/types/competitorLead";

export function useCompetitorLeads(workspaceId?: string) {
  const { firestore } = useFirebase();
  const [leads, setLeads] = useState<CompetitorLead[]>([]);

  useEffect(() => {
    if (!workspaceId || !firestore) {
        setLeads([]);
        return;
    };

    const q = query(
      collection(firestore, "competitorLeads"),
      where("workspaceId", "==", workspaceId),
    );

    const unsub = onSnapshot(q, (snap) => {
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompetitorLead)));
    });

    return () => unsub();
  }, [workspaceId, firestore]);

  return leads;
}
