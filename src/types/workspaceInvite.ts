// src/types/workspaceInvite.ts
export type WorkspaceInviteStatus =
  | "pending"
  | "accepted"
  | "expired"
  | "revoked";

export interface WorkspaceInviteItem {
  id: string;

  masterWorkspaceId: string;
  targetWorkspaceId?: string | null;

  invitedEmail?: string | null;
  token: string;

  scopes: {
    analytics: boolean;
    crm: boolean;
    campaigns: boolean;
    competitorLeads: boolean;
    socialAccounts: boolean;
  };

  status: WorkspaceInviteStatus;

  createdByUserId: string;
  acceptedByUserId?: string | null;

  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}
