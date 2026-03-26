
// src/hooks/useEngagements.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { EngagementItem } from "@/types/engagement";

export function useEngagements(workspaceId?: string) {
  const { firestore } = useFirebase();
  const [engagements, setEngagements] = useState<EngagementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !firestore) {
        setLoading(false);
        setEngagements([]);
        return;
    };

    const colRef = collection(firestore, "engagements");
    const q = query(
      colRef,
      where("workspaceId", "==", workspaceId),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: EngagementItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setEngagements(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useEngagements] erro:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { engagements, loading };
}
