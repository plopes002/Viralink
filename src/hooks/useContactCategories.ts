"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { ContactCategory } from "@/types/contactCategory";

export function useContactCategories(workspaceId?: string) {
  const { firestore } = useFirebase();
  const [categories, setCategories] = useState<ContactCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !firestore) {
        setCategories([]);
        setLoading(false);
        return;
    };

    const colRef = collection(firestore, "contactCategories");
    const q = query(colRef, where("workspaceId", "==", workspaceId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: ContactCategory[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setCategories(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useContactCategories] erro:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { categories, loading };
}
