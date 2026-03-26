// src/hooks/useExecutiveMetrics.ts
"use client";

import { useMemo } from "react";
import { useEngagementProfiles } from "@/hooks/useEngagementProfiles";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useMessages } from "@/hooks/useMessages";
import { useProcessingQueue } from "@/hooks/useProcessingQueue";

export function useExecutiveMetrics(workspaceId?: string) {
  const { profiles, loading: loadingProfiles } =
    useEngagementProfiles(workspaceId);
  const { campaigns, loading: loadingCampaigns } =
    useCampaigns(workspaceId);
  const { messages, loading: loadingMessages } =
    useMessages(workspaceId);
  const { jobs, loading: loadingQueue } =
    useProcessingQueue(workspaceId);

  const metrics = useMemo(() => {
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

  return {
    metrics,
    loading:
      loadingProfiles || loadingCampaigns || loadingMessages || loadingQueue,
  };
}
