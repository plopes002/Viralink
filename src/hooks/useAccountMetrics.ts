// src/hooks/useAccountMetrics.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import type { DayPoint, MetricSnapshot } from "./useCompetitorMetrics";
import { useFirestore } from "@/firebase/provider";

function getWeekdayLabel(date: Date): string {
  const d = date.getDay();
  const map = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return map[d] ?? "";
}

export function useAccountMetrics(accountId: string | null) {
  const db = useFirestore();
  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!accountId || !db) {
      setSnapshots([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const metricsRef = collection(db, "accountMetrics");

    const q = query(
      metricsRef,
      where("accountId", "==", accountId),
      orderBy("createdAt", "desc"),
      limit(7),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items: MetricSnapshot[] = snap.docs.map((doc) => {
          const data = doc.data() as any;
          const created = data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date();
          return {
            id: doc.id,
            competitorId: data.accountId, // reaproveitando campo do tipo
            createdAt: created,
            followersDelta: data.followersDelta ?? 0,
            clicks: data.clicks ?? 0,
            engagementRate: data.engagementRate ?? 0,
          };
        });

        setSnapshots(items.reverse());
        setLoading(false);
      },
      (err) => {
        console.error("[useAccountMetrics] erro:", err);
        setError(err as Error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [accountId, db]);

  const followers7d: DayPoint[] = snapshots.map((s) => ({
    label: getWeekdayLabel(s.createdAt),
    value: s.followersDelta,
  }));

  const clicks7d: DayPoint[] = snapshots.map((s) => ({
    label: getWeekdayLabel(s.createdAt),
    value: s.clicks,
  }));

  const engagement7d: DayPoint[] = snapshots.map((s) => ({
    label: getWeekdayLabel(s.createdAt),
    value: s.engagementRate,
  }));

  return {
    snapshots,
    followers7d,
    clicks7d,
    engagement7d,
    loading,
    error,
  };
}
