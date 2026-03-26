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

    async function tick() {
      try {
        await fetch("/api/queue/process", {
          method: "POST",
        });

        await fetch("/api/messages/process", {
          method: "POST",
        });
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
