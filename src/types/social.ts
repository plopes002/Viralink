// src/types/social.ts

export type SocialProvider = "facebook";

export type SocialAccountType = "profile" | "page";

export interface SocialAccount {
  id: string;
  workspaceId: string;

  provider: SocialProvider;
  type: SocialAccountType;

  externalId: string; // userId ou pageId
  name: string;

  accessToken: string;

  meta?: {
    username?: string;
    picture?: string;
  };

  status: "active" | "expired" | "error";

  createdAt: string;
  updatedAt: string;
}