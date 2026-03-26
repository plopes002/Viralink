// src/types/suppression.ts
export interface SuppressionItem {
  id: string;
  workspaceId: string;
  toUser?: string | null;
  toPhone?: string | null;
  reason: "manual" | "stop_word" | "sem_interesse" | "bounce";
  createdAt: string;
}
