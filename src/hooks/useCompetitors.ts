// src/hooks/useCompetitors.ts
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";

export interface CompetitorItem {
  id: string;
  workspaceId: string;
  name: string;
  username?: string | null;
  platform?: "instagram" | "facebook" | "tiktok" | "youtube" | null;

  followers?: number;
  engagementRate?: number;
  growthRate?: number;
  avgLikes?: number;
  avgComments?: number;

  createdAt?: string;
  updatedAt?: string;
}

export function useCompetitors(workspaceId?: string) {
  const { firestore } = useFirebase();
  const [competitors, setCompetitors] = useState<CompetitorItem[]>([]);
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
        })) as CompetitorItem[];

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
