
// src/hooks/useDraftPosts.ts
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

export interface DraftPost {
  id: string;
  workspaceId: string;
  ownerId: string;
  networks: string[];
  content: {
    text: string;
    mediaType: "image" | "video" | "none";
    mediaUrl?: string | null;
  };
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

interface UseDraftPostsOptions {
  workspaceId: string | null;
}

export function useDraftPosts({ workspaceId }: UseDraftPostsOptions) {
  const { firestore: db } = useFirebase();

  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db || !workspaceId) {
      setDrafts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ref = collection(db, "draftPosts");

    const q = query(
      ref,
      where("workspaceId", "==", workspaceId),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: DraftPost[] = snap.docs.map((doc) => {
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
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : null,
            updatedAt: data.updatedAt?.toDate
              ? data.updatedAt.toDate()
              : null,
          };
        });

        setDrafts(items);
        setLoading(false);
      },
      (err) => {
        console.error("[useDraftPosts] erro:", err);
        setError(err as Error);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [db, workspaceId]);

  return {
    drafts,
    loading,
    error,
  };
}
