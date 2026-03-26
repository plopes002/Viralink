// src/types/workspace.ts
export type WorkspaceKind = "standalone" | "master" | "child";

export interface WorkspaceItem {
  id: string;
  name: string;
  slug?: string | null;
  ownerUserId: string;

  kind: WorkspaceKind;

  createdAt: string;
  updatedAt: string;
}
