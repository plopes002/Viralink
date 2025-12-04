// path: src/domain/posts/postTypes.ts

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
  scheduledAt: FirebaseFirestore.Timestamp | null;
  publishedAt: FirebaseFirestore.Timestamp | null;
  externalPostId: string | null;
  lastError: string | null;
  
  // controle de tentativa
  retryCount?: number;                    // quantas tentativas de publicar
  lastAttemptAt?: FirebaseFirestore.Timestamp | null;
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
  
  // campo auxiliar pro cron encontrar posts agendados
  nextRunAt: FirebaseFirestore.Timestamp | null;
  metricsLastUpdatedAt?: FirebaseFirestore.Timestamp | null;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  deletedAt: FirebaseFirestore.Timestamp | null;
}

/**
 * Versão usada no front-end, incluindo o id do documento.
 */
export interface PostWithId extends PostDocument {
  id: string;
}
