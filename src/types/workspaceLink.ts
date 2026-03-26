// src/types/workspaceLink.ts
export type WorkspaceLinkStatus =
  | "pending"
  | "active"
  | "suspended"
  | "revoked";

export interface WorkspaceAccessScope {
  analytics: boolean;
  crm: boolean;
  campaigns: boolean;
  competitorLeads: boolean;
  socialAccounts: boolean;
}

export interface WorkspaceLinkItem {
  id: string;

  masterWorkspaceId: string;
  childWorkspaceId: string;

  status: WorkspaceLinkStatus;

  scopes: WorkspaceAccessScope;

  createdByUserId: string;
  acceptedByUserId?: string | null;

  createdAt: string;
  acceptedAt?: string | null;
  updatedAt: string;
}
