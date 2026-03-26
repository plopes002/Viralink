// src/hooks/useWorkspaceLinks.ts
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { WorkspaceLinkItem } from "@/types/workspaceLink";

export function useWorkspaceLinks(masterWorkspaceId?: string | null) {
  const { firestore } = useFirebase();
  const [links, setLinks] = useState<WorkspaceLinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!masterWorkspaceId || !firestore) {
      setLinks([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, "workspaceLinks"),
      where("masterWorkspaceId", "==", masterWorkspaceId),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as WorkspaceLinkItem[];

        docs.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        setLinks(docs);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsub();
  }, [masterWorkspaceId, firestore]);

  return { links, loading };
}
