// src/hooks/useSavedCampaignTemplates.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { SavedCampaignTemplate } from "@/types/savedCampaignTemplate";

export function useSavedCampaignTemplates(workspaceId?: string) {
  const { firestore } = useFirebase();
  const [templates, setTemplates] = useState<SavedCampaignTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !firestore) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, "savedCampaignTemplates"),
      where("workspaceId", "==", workspaceId),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: SavedCampaignTemplate[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        docs.sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return String(b.updatedAt).localeCompare(String(a.updatedAt));
        });
        setTemplates(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useSavedCampaignTemplates] erro:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { templates, loading };
}
