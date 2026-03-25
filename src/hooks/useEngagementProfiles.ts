// src/hooks/useEngagementProfiles.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { EngagementProfile } from "@/types/engagementProfile";

export function useEngagementProfiles(workspaceId?: string) {
  const { firestore } = useFirebase();
  const [profiles, setProfiles] = useState<EngagementProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !firestore) {
        setProfiles([]);
        setLoading(false);
        return;
    };

    const q = query(
      collection(firestore, "engagementProfiles"),
      where("workspaceId", "==", workspaceId),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: EngagementProfile[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setProfiles(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useEngagementProfiles] erro:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { profiles, loading };
}
