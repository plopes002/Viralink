// src/hooks/useWorkspace.ts
"use client";

import { useEffect, useState } from "react";
import { useFirebase, useUser } from "@/firebase/provider";
import { ensureWorkspaceForUser } from "@/lib/ensureWorkspace";

export function useWorkspace() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) return;

    if (!user?.uid || !firestore) {
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        const workspace = await ensureWorkspaceForUser(firestore, user.uid);

        if (!mounted) return;
        setCurrentWorkspace(workspace);
      } catch (err) {
        console.error("[useWorkspace] erro:", err);
        if (!mounted) return;
        setCurrentWorkspace(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [firestore, user?.uid, isUserLoading]);

  return {
    currentWorkspace,
    loading,
  };
}
