// path: src/domain/posts/postTypes.ts

import type { Timestamp } from "firebase/firestore";

export type SocialProvider = "instagram" | "facebook" | "whatsapp";

export type PostSource = "manual" | "ai";

export type PostStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export type ChannelStatus = PostStatus;

export interface AiConfig {
  textPrompt?: string;
  imagePrompt?: string;
  model?: string;
  temperature?: number;
}

export type MediaType = "image" | "video" | null;

export type MediaSource = "upload" | "ai" | "external" | null;

export interface MediaInfo {
  type: MediaType;
  source: MediaSource;
  storagePath?: string; // caminho no Storage, não URL pública
  generated?: boolean;
  width?: number;
  height?: number;
  aspectRatio?: string; // ex.: "1:1", "9:16"
}

export interface ChannelConfig {
  provider: SocialProvider;
  accountId: string; // id interno da conta vinculada
  mode: string; // ex.: "feed", "stories", "reels", "page_feed", etc.
  status: ChannelStatus;
  scheduledAt: Timestamp | null;
  publishedAt: Timestamp | null;
  externalPostId: string | null;
  lastError: string | null;
  
  // 🔁 controle de tentativa
  retryCount?: number;                    // quantas tentativas de publicar
  lastAttemptAt?: Timestamp | null;
}

export interface Metrics {
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
}

export interface PostDocument {
  // multi-tenant
  workspaceId: string;
  createdByUid: string;

  source: PostSource;
  status: PostStatus;

  title: string | null;
  caption: string;
  hashtags: string[];
  callToAction: string | null;

  aiConfig: AiConfig | null;
  media: MediaInfo | null;

  channels: ChannelConfig[];

  metrics: Metrics | null;
  
  // 👉 campo auxiliar pro cron encontrar posts agendados
  // menor scheduledAt entre os canais que ainda não publicaram
  nextRunAt: Timestamp | null;

  metricsLastUpdatedAt?: Timestamp | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

/**
 * Versão usada no front-end, incluindo o id do documento.
 */
export interface PostWithId extends PostDocument {
  id: string;
}

// Para agendamentos
export interface ScheduledPost {
  workspaceId: string;
  ownerId: string;
  networks: string[];
  content: {
    text: string;
    mediaType: "image" | "video" | "none";
    mediaUrl: string | null;
  };
  timeZone: string;
  runAt: Timestamp;
  status: "pending" | "processing" | "sent" | "failed";
  lastError: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
