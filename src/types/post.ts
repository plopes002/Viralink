// src/types/post.ts
export type PostStatus = "draft" | "scheduled" | "published";

export type PostNetwork = "instagram" | "facebook" | "whatsapp";

export interface PostDocument {
  id?: string;
  workspaceId: string;
  ownerId: string;

  title?: string; // opcional – pode ser resumo interno
  text: string; // texto final do post
  mediaType: "none" | "image" | "video";
  mediaUrl?: string | null;

  networks: PostNetwork[]; // em quais redes será/foi postado
  status: PostStatus;

  scheduledAt?: string | null; // ISO (UTC) do agendamento
  publishedAt?: string | null; // ISO (UTC) quando realmente foi publicado

  aiToneId?: string | null; // tom de voz (para histórico)
  aiObjectiveId?: string | null; // objetivo do post

  createdAt: string; // ISO
  updatedAt: string; // ISO
}
