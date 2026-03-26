
// src/hooks/useScheduledPosts.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";

export type ScheduledStatus =
  | "pending"
  | "processing"
  | "sent"
  | "failed";

export interface ScheduledPost {
  id: string;
  workspaceId: string;
  ownerId: string;
  networks: string[];
  content: {
    text: string;
    mediaType: "image" | "video" | "none";
    mediaUrl?: string | null;
  };
  timeZone: string;
  runAt: Date;
  status: ScheduledStatus;
  lastError?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

interface UseScheduledPostsOptions {
  workspaceId: string | null;
}

export function useScheduledPosts({ workspaceId }: UseScheduledPostsOptions) {
  const { firestore: db } = useFirebase();

  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db || !workspaceId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ref = collection(db, "scheduledPosts");

    const q = query(
      ref,
      where("workspaceId", "==", workspaceId),
      orderBy("runAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: ScheduledPost[] = snap.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            workspaceId: data.workspaceId,
            ownerId: data.ownerId,
            networks: data.networks ?? [],
            content: {
              text: data.content?.text ?? "",
              mediaType: data.content?.mediaType ?? "none",
              mediaUrl: data.content?.mediaUrl ?? null,
            },
            timeZone: data.timeZone ?? "America/Sao_Paulo",
            runAt: data.runAt?.toDate ? data.runAt.toDate() : new Date(),
            status: data.status ?? "pending",
            lastError: data.lastError ?? null,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : null,
            updatedAt: data.updatedAt?.toDate
              ? data.updatedAt.toDate()
              : null,
          };
        });

        setPosts(items);
        setLoading(false);
      },
      (err) => {
        console.error("[useScheduledPosts] erro:", err);
        setError(err as Error);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [db, workspaceId]);

  // Mapear status "negócio" para as abas
  const mapped = useMemo(() => {
    return posts.map((p) => {
      let boardStatus: "publicado" | "agendado" | "rascunho" | "erro" =
        "agendado";

      if (p.status === "sent") boardStatus = "publicado";
      else if (p.status === "failed") boardStatus = "erro";
      else if (p.status === "pending" || p.status === "processing")
        boardStatus = "agendado";

      return { ...p, boardStatus };
    });
  }, [posts]);

  return {
    posts: mapped,
    rawPosts: posts,
    loading,
    error,
  };
}
