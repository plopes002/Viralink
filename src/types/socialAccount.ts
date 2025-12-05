// src/types/socialAccount.ts
export type SocialNetwork = "instagram" | "facebook" | "whatsapp";

export interface SocialAccount {
  id?: string;
  workspaceId: string;
  network: SocialNetwork;

  displayName: string;          // @perfil ou nome da página
  accountId: string;            // ID da conta na rede

  status: "connected" | "expired" | "disconnected";

  accessTokenMasked?: string;   // nunca o token completo no front
  lastSyncAt?: string | null;   // ISO string, ex.: "2025-03-10T12:00:00Z"

  createdAt: string;            // ISO
  updatedAt: string;            // ISO
}
