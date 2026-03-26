// src/types/workspaceMember.ts
export type WorkspaceRole =
  | "owner"
  | "admin"
  | "manager"
  | "operator"
  | "viewer";

export interface WorkspaceMemberItem {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
