// src/app/(app)/posts/PostAgendaCard.tsx
"use client";

import type { ReactNode } from "react";
import {
  FiInstagram,
  FiFacebook,
  FiMessageCircle,
  FiClock,
  FiAlertTriangle,
  FiEdit2,
  FiCopy,
  FiXCircle,
  FiImage,
  FiVideo,
} from "react-icons/fi";
import type { ScheduledPost } from "@/hooks/useScheduledPosts";
import {
  formatRunAtWithTimezone,
  getTimeZoneLabel,
} from "@/lib/scheduleFormatting";

const iconByNetwork: Record<string, ReactNode> = {
  instagram: <FiInstagram className="h-3.5 w-3.5 text-pink-400" />,
  facebook: <FiFacebook className="h-3.5 w-3.5 text-blue-400" />,
  whatsapp: <FiMessageCircle className="h-3.5 w-3.5 text-emerald-400" />,
};

type PostCardItem = ScheduledPost & { boardStatus: string };

interface Props {
  post: PostCardItem;
  onEdit: (post: PostCardItem) => void;
  onDuplicate: (post: PostCardItem) => void;
  onCancel: (post: PostCardItem) => void;
}

export function PostAgendaCard({
  post,
  onEdit,
  onDuplicate,
  onCancel,
}: Props) {
  const safeRunAt =
    post.runAt && typeof (post.runAt as any).toDate === "function"
      ? (post.runAt as any).toDate()
      : post.runAt ?? null;

  const { full } = formatRunAtWithTimezone(post.runAt, post.timeZone);
  const tzLabel = getTimeZoneLabel(post.timeZone);
  const statusChip = getStatusChip(post);

  const hasMedia =
    post.content?.mediaType &&
    post.content.mediaType !== "none" &&
    !!post.content.mediaUrl;

  return (
    <div className="rounded-2xl border border-[#1F1134] bg-[#050017] px-4 py-3 flex flex-col gap-3 hover:border-[#7C3AED]/70 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[13px] font-medium text-white line-clamp-1">
              {post.content?.text || "Post sem texto (mídia apenas)"}
            </p>
            {statusChip}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#9CA3AF]">
            <div className="flex items-center gap-1 flex-wrap">
              {(post.networks ?? []).map((network) => (
                <span
                  key={network}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#111827] border border-[#272046]"
                >
                  {iconByNetwork[network] ?? null}
                  <span className="capitalize">
                    {network === "whatsapp" ? "WhatsApp" : network}
                  </span>
                </span>
              ))}
            </div>

            <span className="flex items-center gap-1">
              <FiClock className="h-3 w-3 text-[#9CA3AF]" />
              <span>{full}</span>
              <span className="text-[#6B7280]">· {tzLabel}</span>
            </span>
          </div>

          {post.status === "failed" && post.lastError && (
            <div className="mt-1 flex items-center gap-1 text-amber-300 text-[11px]">
              <FiAlertTriangle className="h-3.5 w-3.5" />
              <span className="max-w-xs line-clamp-2">
                Falha ao publicar: {post.lastError}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 text-[10px]">
          {hasMedia && (
            <div className="flex items-center gap-1 mb-1 text-[#E5E7EB]">
              {post.content?.mediaType === "image" ? (
                <FiImage className="h-3.5 w-3.5 text-sky-400" />
              ) : (
                <FiVideo className="h-3.5 w-3.5 text-violet-400" />
              )}
              <span>Mídia anexada</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(post)}
              className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-[#312356] bg-[#050017] text-[#E5E7EB] hover:bg-[#111827] transition"
              title="Editar agendamento"
            >
              <FiEdit2 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDuplicate(post)}
              className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-[#312356] bg-[#050017] text-[#E5E7EB] hover:bg-[#111827] transition"
              title="Duplicar post"
            >
              <FiCopy className="h-3.5 w-3.5" />
            </button>

            {post.status !== "sent" && post.status !== "failed" && (
              <button
                type="button"
                onClick={() => onCancel(post)}
                className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-[#4B1D2A] bg-[#050017] text-[#FCA5A5] hover:bg-[#111827] transition"
                title="Cancelar agendamento"
              >
                <FiXCircle className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <span className="text-[#6B7280]">
            ID: <span className="text-[#9CA3AF]">{post.id.slice(0, 8)}...</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function getStatusChip(post: PostCardItem) {
  if (post.status === "sent") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
        Publicado
      </span>
    );
  }

  if (post.status === "failed") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
        <FiAlertTriangle className="h-3 w-3" />
        Erro ao publicar
      </span>
    );
  }

  if (post.status === "processing") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/40">
        Publicando...
      </span>
    );
  }

  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/40">
      Agendado
    </span>
  );
}