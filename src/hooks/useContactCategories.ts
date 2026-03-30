// src/hooks/useContactCategories.ts
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
    }

    setLoading(true);

    const q = query(
      collection(firestore, "contactCategories"),
      where("workspaceId", "==", workspaceId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: ContactCategory[] = snap.docs.map((doc) => {
          const data = doc.data() as any;

          return {
            id: doc.id,
            workspaceId: data.workspaceId || "",
            name: data.name || "Sem nome",
            slug: data.slug || "",
            color: data.color || null,
            createdAt: data.createdAt || "",
          };
        });

        setCategories(docs);
        setLoading(false);
      },
      (error) => {
        console.error("[useContactCategories] erro:", error);
        setCategories([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { categories, loading };
}