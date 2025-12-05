// src/app/(app)/posts/DraftPostCard.tsx
"use client";

import {
  FiInstagram,
  FiFacebook,
  FiMessageCircle,
  FiEdit2,
  FiPlayCircle,
  FiTrash2,
  FiImage,
  FiVideo,
} from "react-icons/fi";
import type { DraftPost } from "@/hooks/useDraftPosts";

const iconByNetwork: Record<string, JSX.Element> = {
  instagram: <FiInstagram className="h-3.5 w-3.5 text-pink-400" />,
  facebook: <FiFacebook className="h-3.5 w-3.5 text-blue-400" />,
  whatsapp: <FiMessageCircle className="h-3.5 w-3.5 text-emerald-400" />,
};

interface Props {
  draft: DraftPost;
  onEdit: (draft: DraftPost) => void;
  onQuickSchedule: (draft: DraftPost) => void;
  onDelete: (draft: DraftPost) => void;
}

export function DraftPostCard({
  draft,
  onEdit,
  onQuickSchedule,
  onDelete,
}: Props) {
  const hasMedia =
    draft.content.mediaType !== "none" && !!draft.content.mediaUrl;

  return (
    <div className="rounded-2xl border border-[#1F1134] bg-[#050017] px-4 py-3 flex flex-col gap-3 hover:border-[#7C3AED]/70 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[13px] font-medium text-white line-clamp-1">
              {draft.content.text || "Rascunho sem texto (mídia apenas)"}
            </p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-200 border border-slate-500/40">
              Rascunho
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#9CA3AF]">
            <div className="flex items-center gap-1 flex-wrap">
              {draft.networks.map((network) => (
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

            <span className="text-[#6B7280]">
              Rascunho ainda não agendado
            </span>
          </div>

          {hasMedia && (
            <div className="mt-1 flex items-center gap-1 text-[#E5E7EB] text-[11px]">
              {draft.content.mediaType === "image" ? (
                <FiImage className="h-3.5 w-3.5 text-sky-400" />
              ) : (
                <FiVideo className="h-3.5 w-3.5 text-violet-400" />
              )}
              <span>Mídia anexada</span>
            </div>
          )}
        </div>

        {/* ações */}
        <div className="flex flex-col items-end gap-1 text-[10px]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(draft)}
              className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-[#312356] bg-[#050017] text-[#E5E7EB] hover:bg-[#111827] transition"
              title="Editar rascunho"
            >
              <FiEdit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onQuickSchedule(draft)}
              className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-[#1D3B4B] bg-[#050017] text-[#7DD3FC] hover:bg-[#111827] transition"
              title="Agendar para daqui 1 hora"
            >
              <FiPlayCircle className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(draft)}
              className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-[#4B1D2A] bg-[#050017] text-[#FCA5A5] hover:bg-[#111827] transition"
              title="Excluir rascunho"
            >
              <FiTrash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-[#6B7280]">
            ID:{" "}
            <span className="text-[#9CA3AF]">
              {draft.id.slice(0, 8)}...
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
