// src/hooks/useCampaigns.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { Campaign } from "@/types/campaign";

export function useCampaigns(workspaceId?: string) {
  const { firestore } = useFirebase();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !firestore) {
        setCampaigns([]);
        setLoading(false);
        return;
    };

    const q = query(
      collection(firestore, "campaigns"),
      where("workspaceId", "==", workspaceId),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: Campaign[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setCampaigns(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useCampaigns] erro:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { campaigns, loading };
}
