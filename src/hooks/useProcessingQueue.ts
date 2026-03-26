// src/hooks/useProcessingQueue.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { ProcessingQueueJob } from "@/types/processingQueue";

export function useProcessingQueue(workspaceId?: string) {
  const { firestore } = useFirebase();
  const [jobs, setJobs] = useState<ProcessingQueueJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) {
        setJobs([]);
        setLoading(false);
        return;
    }

    const q = query(
      collection(firestore, "processingQueue"),
      where("workspaceId", "==", workspaceId),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: ProcessingQueueJob[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setJobs(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useProcessingQueue] erro:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { jobs, loading };
}
