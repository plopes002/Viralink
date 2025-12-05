// src/hooks/usePosts.ts
"use client";

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useFirebase } from "@/firebase/provider";
import type { PostDocument, PostStatus } from "@/types/post";

type UsePostsOptions = {
  workspaceId?: string;
  status?: PostStatus | "all";
};

export function usePosts({ workspaceId, status = "all" }: UsePostsOptions) {
  const { firestore } = useFirebase();
  const [posts, setPosts] = useState<PostDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) {
        setLoading(false);
        return;
    };

    const baseRef = collection(firestore, "posts");
    const constraints: any[] = [where("workspaceId", "==", workspaceId)];

    if (status !== "all") {
      constraints.push(where("status", "==", status));
    }

    const q = query(baseRef, ...constraints, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const docs: PostDocument[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setPosts(docs);
      setLoading(false);
    }, (err) => {
        console.error("Error fetching posts:", err);
        setLoading(false);
    });

    return () => unsub();
  }, [workspaceId, status, firestore]);

  return { posts, loading };
}
