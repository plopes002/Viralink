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

  executiveScore: number;
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

  executiveScore: 0,
};

function preferApiMetric(apiValue: number, localValue: number) {
  return apiValue > 0 ? apiValue : localValue;
}

export function useExecutiveMetrics(
  workspaceId?: string,
  network: "all" | "instagram" | "facebook" = "all"
) {
  const { profiles, loading: loadingProfiles } =
    useEngagementProfiles(workspaceId);
  const { campaigns, loading: loadingCampaigns } = useCampaigns(workspaceId);
  const { messages, loading: loadingMessages } = useMessages(workspaceId);
  const { jobs, loading: loadingQueue } = useProcessingQueue(workspaceId);

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
          `/api/executivo/metrics?workspaceId=${encodeURIComponent(
            workspaceId
          )}&network=${encodeURIComponent(network)}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (!cancelled && data?.ok && data?.metrics) {
          setApiMetrics({
            ...EMPTY_METRICS,
            ...data.metrics,
          });
        } else if (!cancelled) {
          setApiMetrics(EMPTY_METRICS);
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
  }, [workspaceId, network]);

  const localMetrics = useMemo<ExecutiveMetrics>(() => {
    const totalProfiles = profiles.length;
    const hotLeads = profiles.filter((p) => p.leadTemperature === "hot").length;
    const priorityLeads = profiles.filter(
      (p) => p.leadTemperature === "priority"
    ).length;

    const totalCampaigns = campaigns.length;
    const queuedCampaigns = campaigns.filter((c) => c.status === "queued").length;
    const processingCampaigns = campaigns.filter(
      (c) => c.status === "processing"
    ).length;
    const doneCampaigns = campaigns.filter((c) => c.status === "done").length;
    const errorCampaigns = campaigns.filter((c) => c.status === "error").length;

    const totalMessages = messages.length;
    const queuedMessages = messages.filter((m) => m.status === "queued").length;
    const processingMessages = messages.filter(
      (m) => m.status === "processing"
    ).length;
    const sentMessages = messages.filter((m) => m.status === "sent").length;
    const errorMessages = messages.filter((m) => m.status === "error").length;

    const errorRate =
      totalMessages > 0
        ? Number(((errorMessages / totalMessages) * 100).toFixed(1))
        : 0;

    const queuePending = jobs.filter((j) => j.status === "pending").length;
    const queueProcessing = jobs.filter((j) => j.status === "processing").length;
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

      executiveScore: 0,
    };
  }, [profiles, campaigns, messages, jobs]);

  const metrics = useMemo<ExecutiveMetrics>(() => {
    const totalMessages = preferApiMetric(
      apiMetrics.totalMessages,
      localMetrics.totalMessages
    );

    const errorMessages = preferApiMetric(
      apiMetrics.errorMessages,
      localMetrics.errorMessages
    );

    const errorRate =
      totalMessages > 0
        ? Number(((errorMessages / totalMessages) * 100).toFixed(1))
        : 0;

    return {
      totalProfiles: preferApiMetric(
        apiMetrics.totalProfiles,
        localMetrics.totalProfiles
      ),
      hotLeads: preferApiMetric(apiMetrics.hotLeads, localMetrics.hotLeads),
      priorityLeads: preferApiMetric(
        apiMetrics.priorityLeads,
        localMetrics.priorityLeads
      ),

      totalCampaigns: preferApiMetric(
        apiMetrics.totalCampaigns,
        localMetrics.totalCampaigns
      ),
      queuedCampaigns: preferApiMetric(
        apiMetrics.queuedCampaigns,
        localMetrics.queuedCampaigns
      ),
      processingCampaigns: preferApiMetric(
        apiMetrics.processingCampaigns,
        localMetrics.processingCampaigns
      ),
      doneCampaigns: preferApiMetric(
        apiMetrics.doneCampaigns,
        localMetrics.doneCampaigns
      ),
      errorCampaigns: preferApiMetric(
        apiMetrics.errorCampaigns,
        localMetrics.errorCampaigns
      ),

      totalMessages,
      queuedMessages: preferApiMetric(
        apiMetrics.queuedMessages,
        localMetrics.queuedMessages
      ),
      processingMessages: preferApiMetric(
        apiMetrics.processingMessages,
        localMetrics.processingMessages
      ),
      sentMessages: preferApiMetric(
        apiMetrics.sentMessages,
        localMetrics.sentMessages
      ),
      errorMessages,
      errorRate,

      queuePending: preferApiMetric(
        apiMetrics.queuePending,
        localMetrics.queuePending
      ),
      queueProcessing: preferApiMetric(
        apiMetrics.queueProcessing,
        localMetrics.queueProcessing
      ),
      queueDone: preferApiMetric(apiMetrics.queueDone, localMetrics.queueDone),
      queueErrors: preferApiMetric(
        apiMetrics.queueErrors,
        localMetrics.queueErrors
      ),

      executiveScore: Number(apiMetrics.executiveScore || 0),
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