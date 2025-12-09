// src/types/internalSocialEvent.ts
export type InternalSocialEventType =
  | "new_follower"
  | "new_comment"
  | "new_message"
  | "new_reaction";

export interface InternalSocialEvent {
  workspaceId: string;
  socialAccountId: string; // id do doc em socialAccounts
  network: "instagram" | "facebook" | "whatsapp";
  type: InternalSocialEventType;
  text: string;

  fromUser: {
    externalId: string;   // ID do usuário na rede (ig_user_id)
    name?: string;
    username?: string;
  };

  raw: any;
  receivedAt: string;
}
