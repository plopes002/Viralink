// src/types/contactHistory.ts
export type ContactHistoryType =
  | "created"
  | "status_changed"
  | "note_added"
  | "campaign_sent"
  | "message_sent"
  | "whatsapp_opened"
  | "profile_imported"
  | "manual_update";

export interface ContactHistoryItem {
  id: string;
  workspaceId: string;
  contactId: string;
  type: ContactHistoryType;
  title: string;
  description?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}
