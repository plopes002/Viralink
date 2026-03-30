// src/hooks/useQueuePolling.ts
"use client";

import { useEffect } from "react";

type Options = {
  enabled?: boolean;
  intervalMs?: number;
};

export function useQueuePolling(options?: Options) {
  const enabled = options?.enabled ?? true;
  const intervalMs = options?.intervalMs ?? 20000;

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;

    async function safePost(url: string) {
      const res = await fetch(url, { method: "POST" });

      if (!res.ok) {
        let details = "";
        try {
          const data = await res.json();
          details = data?.error || data?.message || JSON.stringify(data);
        } catch {
          details = await res.text();
        }

        console.error(`[useQueuePolling] ${url} falhou:`, res.status, details);
      }
    }

    async function tick() {
      try {
        await safePost("/api/queue/process");
        await safePost("/api/messages/process");
      } catch (err) {
        console.error("[useQueuePolling] erro:", err);
      }
    }

    tick();

    const interval = setInterval(() => {
      if (!stopped) tick();
    }, intervalMs);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [enabled, intervalMs]);
}