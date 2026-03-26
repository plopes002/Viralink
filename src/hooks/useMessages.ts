// src/hooks/useMessages.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { MessageItem } from "@/types/message";

export function useMessages(workspaceId?: string) {
  const { firestore } = useFirebase();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !firestore) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, "messages"),
      where("workspaceId", "==", workspaceId),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: MessageItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setMessages(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useMessages] erro:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { messages, loading };
}
