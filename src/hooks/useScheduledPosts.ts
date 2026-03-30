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
import type { ScheduledPost as ScheduledPostType } from "@/domain/posts/postTypes";

export type ScheduledPost = ScheduledPostType & {
  id: string;
  boardStatus: "publicado" | "agendado" | "rascunho" | "erro";
};

interface UseScheduledPostsOptions {
  workspaceId?: string | null;
}

export function useScheduledPosts(options?: UseScheduledPostsOptions | null) {
  const workspaceId = options?.workspaceId;
  const { firestore } = useFirebase();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
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
      orderBy("runAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const now = new Date();

        const docs: ScheduledPost[] = snap.docs.map((d) => {
          const data = d.data() as any;
        
          const status = data.status ?? "pending";
        
          let boardStatus: ScheduledPost["boardStatus"] = "agendado";
        
          if (status === "sent") {
            boardStatus = "publicado";
          } else if (status === "failed") {
            boardStatus = "erro";
          } else if (status === "pending" || status === "processing") {
             boardStatus = "agendado";
          }
        
          return {
            id: d.id,
            ...(data as ScheduledPostType),
            boardStatus,
          };
        });
        
        setPosts(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useScheduledPosts] erro ao carregar posts agendados:", err);
        setPosts([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { posts, loading };
}
