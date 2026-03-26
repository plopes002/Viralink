// src/hooks/useContactHistory.ts
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { ContactHistoryItem } from "@/types/contactHistory";

export function useContactHistory(workspaceId?: string, contactId?: string) {
  const { firestore } = useFirebase();
  const [items, setItems] = useState<ContactHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !contactId || !firestore) {
      setItems([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, "contactHistory"),
      where("workspaceId", "==", workspaceId),
      where("contactId", "==", contactId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: ContactHistoryItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setItems(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useContactHistory] erro:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, contactId, firestore]);

  return { items, loading };
}
