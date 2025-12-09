// src/hooks/useAutomations.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { AutomationRule } from "@/types/automation";

export function useAutomations(workspaceId?: string) {
  const { firestore } = useFirebase();
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) {
        setLoading(false);
        setAutomations([]);
        return;
    };

    const colRef = collection(firestore, "automations");
    const q = query(colRef, where("workspaceId", "==", workspaceId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: AutomationRule[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setAutomations(docs);
        setLoading(false);
      },
      (err) => {
        console.error("[useAutomations] erro ao escutar automações:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, firestore]);

  return { automations, loading };
}
