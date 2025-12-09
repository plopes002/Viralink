// src/types/automation.ts
export type AutomationTriggerType =
  | "new_follower"
  | "new_comment"
  | "new_message"
  | "new_reaction";

export type AutomationChannel = "instagram_dm" | "facebook_dm" | "whatsapp";

export interface AutomationRule {
  id?: string;
  workspaceId: string;

  name: string;
  active: boolean;

  /** Ex: new_follower, new_comment, etc. */
  triggerType: AutomationTriggerType;

  /** Rede alvo principal (para o gatilho) */
  network: "instagram" | "facebook" | "whatsapp";

  /** Conta conectada usada nessa automação (FK pra socialAccounts.id) */
  socialAccountId: string;

  /** Canal onde a mensagem será enviada (DM, WhatsApp etc.) */
  actionChannel: AutomationChannel;

  /** ID de um template de mensagem salvo (podemos implementar depois) */
  messageTemplateId: string;

  /** Condições extras (opcional) */
  conditions?: {
    containsKeyword?: string; // ex.: responder só se o comentário tiver "preço"
    minFollowers?: number;
  };

  createdAt: string; // ISO
  updatedAt: string; // ISO
}
