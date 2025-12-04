// src/hooks/useCompetitorMetrics.ts
"use client";

import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";

export interface DayPoint {
  label: string; // ex: "Seg", "Ter"...
  value: number;
}

export interface MetricSnapshot {
  id: string;
  competitorId: string;
  createdAt: Date;
  followersDelta: number;
  clicks: number;
  engagementRate: number;
}

function getWeekdayLabel(date: Date): string {
  const d = date.getDay();
  const map = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return map[d] ?? "";
}

export function useCompetitorMetrics(competitorId: string | null) {
  const db = useFirestore();
  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!competitorId || !db) {
      setSnapshots([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const metricsRef = collection(db, "competitors", competitorId, "metricsSnapshots");

    const q = query(
      metricsRef,
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
            competitorId: competitorId,
            createdAt: created,
            followersDelta: data.followersDelta ?? data.followers ?? 0,
            clicks: data.clicks ?? 0,
            engagementRate: data.engagementRate ?? 0,
          };
        });

        // inverte para ficar do mais antigo -> mais recente
        setSnapshots(items.reverse());
        setLoading(false);
      },
      (err) => {
        console.error("[useCompetitorMetrics] erro:", err);
        setError(err as Error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [competitorId, db]);

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