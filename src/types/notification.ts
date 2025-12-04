// src/types/notification.ts
export type NotificationType =
  | "post_published"
  | "post_publish_failed"
  | "metrics_updated";

export interface Notification {
  id: string;
  workspaceId: string;
  type: NotificationType;
  postId?: string;
  channels?: string[];
  message: string;
  createdAt: Date;
  readBy?: string[]; // uids que já leram
}
