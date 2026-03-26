// src/types/message.ts
export type MessageChannel = "instagram_dm" | "facebook_dm" | "whatsapp";

export type MessageStatus =
  | "queued"
  | "awaiting_review"
  | "scheduled"
  | "processing"
  | "sent"
  | "skipped"
  | "error";

export interface MessageItem {
  id: string;
  workspaceId: string;
  campaignId?: string | null;

  toUser?: string | null;
  toPhone?: string | null;
  toEmail?: string | null;

  channel: MessageChannel;
  content: string;
  status: MessageStatus;

  scheduledAt?: string | null;
  errorMessage?: string | null;

  createdAt: string;
  updatedAt?: string;
}
