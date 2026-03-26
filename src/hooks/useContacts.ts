// src/hooks/useContacts.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { ContactItem } from "@/types/contact";

export function useContacts(workspaceId?: string) {
  const { firestore } = useFirebase();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !firestore) {
        setContacts([]);
        setLoading(false);
        return;
    };

    const q = query(
      collection(firestore, "contacts"),
      where("workspaceId", "==", workspaceId),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: ContactItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setContacts(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useContacts] erro:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { contacts, loading };
}
