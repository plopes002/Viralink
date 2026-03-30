// src/hooks/useExecutiveMetrics.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { useEngagementProfiles } from "@/hooks/useEngagementProfiles";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useMessages } from "@/hooks/useMessages";
import { useProcessingQueue } from "@/hooks/useProcessingQueue";

type ExecutiveMetrics = {
  totalProfiles: number;
  hotLeads: number;
  priorityLeads: number;

  totalCampaigns: number;
  queuedCampaigns: number;
  processingCampaigns: number;
  doneCampaigns: number;
  errorCampaigns: number;

  totalMessages: number;
  queuedMessages: number;
  processingMessages: number;
  sentMessages: number;
  errorMessages: number;
  errorRate: number;

  queuePending: number;
  queueProcessing: number;
  queueDone: number;
  queueErrors: number;
};

const EMPTY_METRICS: ExecutiveMetrics = {
  totalProfiles: 0,
  hotLeads: 0,
  priorityLeads: 0,

  totalCampaigns: 0,
  queuedCampaigns: 0,
  processingCampaigns: 0,
  doneCampaigns: 0,
  errorCampaigns: 0,

  totalMessages: 0,
  queuedMessages: 0,
  processingMessages: 0,
  sentMessages: 0,
  errorMessages: 0,
  errorRate: 0,

  queuePending: 0,
  queueProcessing: 0,
  queueDone: 0,
  queueErrors: 0,
};

function chooseMetric(localValue: number, remoteValue: number) {
  return localValue > 0 ? localValue : remoteValue;
}

export function useExecutiveMetrics(workspaceId?: string) {
  const { profiles, loading: loadingProfiles } =
    useEngagementProfiles(workspaceId);
  const { campaigns, loading: loadingCampaigns } =
    useCampaigns(workspaceId);
  const { messages, loading: loadingMessages } =
    useMessages(workspaceId);
  const { jobs, loading: loadingQueue } =
    useProcessingQueue(workspaceId);

  const [apiMetrics, setApiMetrics] = useState<ExecutiveMetrics>(EMPTY_METRICS);
  const [loadingApi, setLoadingApi] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadApiMetrics() {
      if (!workspaceId) {
        setApiMetrics(EMPTY_METRICS);
        setLoadingApi(false);
        return;
      }

      try {
        setLoadingApi(true);

        const res = await fetch(
          `/api/executivo/metrics?workspaceId=${workspaceId}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (!cancelled && data?.ok && data?.metrics) {
          setApiMetrics({
            ...EMPTY_METRICS,
            ...data.metrics,
          });
        }
      } catch (error) {
        console.error("[useExecutiveMetrics] erro ao carregar API:", error);

        if (!cancelled) {
          setApiMetrics(EMPTY_METRICS);
        }
      } finally {
        if (!cancelled) {
          setLoadingApi(false);
        }
      }
    }

    loadApiMetrics();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const localMetrics = useMemo<ExecutiveMetrics>(() => {
    const totalProfiles = profiles.length;
    const hotLeads = profiles.filter((p) => p.leadTemperature === "hot").length;
    const priorityLeads = profiles.filter(
      (p) => p.leadTemperature === "priority",
    ).length;

    const totalCampaigns = campaigns.length;
    const queuedCampaigns = campaigns.filter((c) => c.status === "queued").length;
    const processingCampaigns = campaigns.filter(
      (c) => c.status === "processing",
    ).length;
    const doneCampaigns = campaigns.filter((c) => c.status === "done").length;
    const errorCampaigns = campaigns.filter((c) => c.status === "error").length;

    const totalMessages = messages.length;
    const queuedMessages = messages.filter((m) => m.status === "queued").length;
    const processingMessages = messages.filter(
      (m) => m.status === "processing",
    ).length;
    const sentMessages = messages.filter((m) => m.status === "sent").length;
    const errorMessages = messages.filter((m) => m.status === "error").length;

    const errorRate =
      totalMessages > 0
        ? Number(((errorMessages / totalMessages) * 100).toFixed(1))
        : 0;

    const queuePending = jobs.filter((j) => j.status === "pending").length;
    const queueProcessing = jobs.filter(
      (j) => j.status === "processing",
    ).length;
    const queueDone = jobs.filter((j) => j.status === "done").length;
    const queueErrors = jobs.filter((j) => j.status === "error").length;

    return {
      totalProfiles,
      hotLeads,
      priorityLeads,

      totalCampaigns,
      queuedCampaigns,
      processingCampaigns,
      doneCampaigns,
      errorCampaigns,

      totalMessages,
      queuedMessages,
      processingMessages,
      sentMessages,
      errorMessages,
      errorRate,

      queuePending,
      queueProcessing,
      queueDone,
      queueErrors,
    };
  }, [profiles, campaigns, messages, jobs]);

  const metrics = useMemo<ExecutiveMetrics>(() => {
    return {
      totalProfiles: chooseMetric(
        localMetrics.totalProfiles,
        apiMetrics.totalProfiles
      ),
      hotLeads: chooseMetric(
        localMetrics.hotLeads,
        apiMetrics.hotLeads
      ),
      priorityLeads: chooseMetric(
        localMetrics.priorityLeads,
        apiMetrics.priorityLeads
      ),

      totalCampaigns: chooseMetric(
        localMetrics.totalCampaigns,
        apiMetrics.totalCampaigns
      ),
      queuedCampaigns: chooseMetric(
        localMetrics.queuedCampaigns,
        apiMetrics.queuedCampaigns
      ),
      processingCampaigns: chooseMetric(
        localMetrics.processingCampaigns,
        apiMetrics.processingCampaigns
      ),
      doneCampaigns: chooseMetric(
        localMetrics.doneCampaigns,
        apiMetrics.doneCampaigns
      ),
      errorCampaigns: chooseMetric(
        localMetrics.errorCampaigns,
        apiMetrics.errorCampaigns
      ),

      totalMessages: chooseMetric(
        localMetrics.totalMessages,
        apiMetrics.totalMessages
      ),
      queuedMessages: chooseMetric(
        localMetrics.queuedMessages,
        apiMetrics.queuedMessages
      ),
      processingMessages: chooseMetric(
        localMetrics.processingMessages,
        apiMetrics.processingMessages
      ),
      sentMessages: chooseMetric(
        localMetrics.sentMessages,
        apiMetrics.sentMessages
      ),
      errorMessages: chooseMetric(
        localMetrics.errorMessages,
        apiMetrics.errorMessages
      ),
      errorRate:
        localMetrics.totalMessages > 0
          ? localMetrics.errorRate
          : apiMetrics.errorRate,

      queuePending: chooseMetric(
        localMetrics.queuePending,
        apiMetrics.queuePending
      ),
      queueProcessing: chooseMetric(
        localMetrics.queueProcessing,
        apiMetrics.queueProcessing
      ),
      queueDone: chooseMetric(
        localMetrics.queueDone,
        apiMetrics.queueDone
      ),
      queueErrors: chooseMetric(
        localMetrics.queueErrors,
        apiMetrics.queueErrors
      ),
    };
  }, [localMetrics, apiMetrics]);

  return {
    metrics,
    loading:
      loadingProfiles ||
      loadingCampaigns ||
      loadingMessages ||
      loadingQueue ||
      loadingApi,
  };
}