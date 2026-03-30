// src/hooks/useWorkspaces.ts
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { WorkspaceItem } from "@/types/workspace";

export function useWorkspaces() {
  const { firestore } = useFirebase();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) {
      setWorkspaces([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      collection(firestore, "workspaces"),
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as WorkspaceItem[];

        setWorkspaces(docs);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsub();
  }, [firestore]);

  return { workspaces, loading };
}
