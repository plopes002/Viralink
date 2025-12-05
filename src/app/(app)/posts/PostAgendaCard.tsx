// src/app/(app)/posts/PostAgendaCard.tsx
"use client";

import {
  FiInstagram,
  FiFacebook,
  FiMessageCircle,
  FiClock,
  FiAlertTriangle,
} from "react-icons/fi";
import { ScheduledPost } from "@/hooks/useScheduledPosts";
import {
  formatRunAtWithTimezone,
  getTimeZoneLabel,
} from "@/lib/scheduleFormatting";

const iconByNetwork: Record<string, JSX.Element> = {
  instagram: <FiInstagram className="h-3.5 w-3.5 text-pink-400" />,
  facebook: <FiFacebook className="h-3.5 w-3.5 text-blue-400" />,
  whatsapp: <FiMessageCircle className="h-3.5 w-3.5 text-emerald-400" />,
};

interface Props {
  post: ScheduledPost & { boardStatus: string };
}

export function PostAgendaCard({ post }: Props) {
  const { full, label, timeOnly } = formatRunAtWithTimezone(
    post.runAt,
    post.timeZone,
  );
  const tzLabel = getTimeZoneLabel(post.timeZone);

  const statusChip = getStatusChip(post);

  return (
    <div className="rounded-2xl border border-[#1F1134] bg-[#050017] px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:border-[#7C3AED]/70 transition">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-white line-clamp-1">
            {post.content.text || "Post sem texto (mídia apenas)"}
          </p>
          {statusChip}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#9CA3AF]">
          <div className="flex items-center gap-1">
            {post.networks.map((network) => (
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
      </div>

      {/* Coluna direita: infos adicionais */}
      <div className="flex flex-col items-start md:items-end gap-1 text-[11px]">
        {post.status === "failed" && post.lastError && (
          <div className="flex items-center gap-1 text-amber-300">
            <FiAlertTriangle className="h-3.5 w-3.5" />
            <span className="max-w-xs line-clamp-2">
              Falha ao publicar: {post.lastError}
            </span>
          </div>
        )}

        <span className="text-[#6B7280]">
          ID agendamento:{" "}
          <span className="text-[#9CA3AF]">{post.id.slice(0, 8)}...</span>
        </span>
      </div>
    </div>
  );
}

function getStatusChip(post: ScheduledPost & { boardStatus: string }) {
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

  // pending
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/40">
      Agendado
    </span>
  );
}
