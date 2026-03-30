// src/hooks/useSocialAccounts.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { SocialAccount } from "@/types/socialAccount";

export function useSocialAccounts(
  workspaceId?: string,
  ownerUserId?: string
) {
  const { firestore } = useFirebase();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !ownerUserId || !firestore) {
      setLoading(false);
      setAccounts([]);
      return;
    }

    setLoading(true);

    // ✅ AQUI estava faltando
    const colRef = collection(firestore, "socialAccounts");

    const q = query(
      colRef,
      where("workspaceId", "==", workspaceId),
      where("ownerUserId", "==", ownerUserId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: SocialAccount[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        docs.sort(
          (a, b) =>
            Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary))
        );

        setAccounts(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useSocialAccounts] erro:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [workspaceId, ownerUserId, firestore]);

  return { accounts, loading };
}
