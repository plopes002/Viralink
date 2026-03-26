// src/types/processingQueue.ts
export type QueueJobType =
  | "engagement_profile_update"
  | "engagement_sentiment_analysis"
  | "engagement_category_suggestion"
  | "engagement_political_review";

export type QueueJobStatus =
  | "pending"
  | "processing"
  | "done"
  | "error";

export interface ProcessingQueueJob {
  id: string;
  type: QueueJobType;
  workspaceId: string;
  engagementId?: string;
  status: QueueJobStatus;
  attempts: number;
  payload?: Record<string, any>;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}
