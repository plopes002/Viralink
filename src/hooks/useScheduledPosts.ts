// src/hooks/useScheduledPosts.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";

export type ScheduledPostItem = {
  id: string;
  workspaceId: string;
  networks?: string[];
  title?: string;
  content?: { text: string };
  runAt?: Timestamp;
  status?: string;
};

export function useScheduledPosts(workspaceId?: string) {
  const { firestore } = useFirebase();
  const [posts, setPosts] = useState<ScheduledPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !firestore) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const colRef = collection(firestore, "scheduledPosts");
    const q = query(
      colRef,
      where("workspaceId", "==", workspaceId),
      orderBy("runAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const now = new Date();

        const docs = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }))
          .filter((item) => {
            if (!item.runAt) return false;
            const scheduledDate = item.runAt.toDate(); // Convert Firestore Timestamp to JS Date
            return scheduledDate >= now;
          })
          .slice(0, 3);

        setPosts(docs as ScheduledPostItem[]);
        setLoading(false);
      },
      (err) => {
        console.error("[useScheduledPosts] erro ao escutar posts agendados:", err);
        setPosts([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { posts, loading };
}
