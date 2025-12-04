// src/types/notification.ts
export type NotificationType =
  | "post_published"
  | "post_publish_failed"
  | "metrics_updated"
  | "competitor_alert"; // 👈 NOVO

export interface Notification {
  id: string;
  workspaceId: string;
  type: NotificationType;
  postId?: string;
  channels?: string[];
  competitorId?: string; // 👈 opcional, para eventos de concorrentes
  message: string;
  createdAt: Date;
  readBy?: string[];
}
