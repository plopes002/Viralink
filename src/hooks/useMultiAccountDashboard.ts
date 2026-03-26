// src/hooks/useMultiAccountDashboard.ts
"use client";

import { useEffect, useState } from "react";

export function useMultiAccountDashboard(masterWorkspaceId?: string | null) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!masterWorkspaceId) {
      setData(null);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/multi-account/dashboard?masterWorkspaceId=${masterWorkspaceId}`,
        );
        const json = await res.json();
        if (active) setData(json);
      } catch {
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    const timer = setInterval(load, 20000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [masterWorkspaceId]);

  return { data, loading };
}
