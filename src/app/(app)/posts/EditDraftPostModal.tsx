// src/app/(app)/posts/EditDraftPostModal.tsx
"use client";

import { useEffect, useState } from "react";
import type { DraftPost } from "@/hooks/useDraftPosts";
import { useDraftPostActions, MediaType } from "@/hooks/useDraftPostActions";

interface EditDraftPostModalProps {
  draft: DraftPost | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditDraftPostModal({
  draft,
  isOpen,
  onClose,
}: EditDraftPostModalProps) {
  const { updateDraft } = useDraftPostActions();

  const [text, setText] = useState("");
  const [networks, setNetworks] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<MediaType>("none");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!draft || !isOpen) return;

    setText(draft.content.text ?? "");
    setNetworks(draft.networks ?? []);
    setMediaType(draft.content.mediaType ?? "none");
    setMediaUrl(draft.content.mediaUrl ?? null);
  }, [draft, isOpen]);

  if (!isOpen || !draft) return null;

  const handleToggleNetwork = (network: string) => {
    setNetworks((prev) =>
      prev.includes(network)
        ? prev.filter((n) => n !== network)
        : [...prev, network],
    );
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!text && !mediaUrl) {
      alert("Adicione texto ou uma mídia antes de salvar o rascunho.");
      return;
    }

    setSaving(true);
    try {
      await updateDraft(draft.id, {
        workspaceId: draft.workspaceId,
        ownerId: draft.ownerId,
        networks,
        text,
        mediaType,
        mediaUrl,
      });
      onClose();
    } catch (err) {
      console.error("[EditDraftPostModal] erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[#312356] bg-[#050017] p-4 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Editar rascunho
            </h2>
            <p className="text-[11px] text-[#9CA3AF]">
              Ajuste o texto, redes e mídia antes de agendar ou publicar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white text-xs"
          >
            Fechar ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className="space-y-3">
          {/* Texto */}
          <div>
            <label className="text-[11px] text-[#E5E7EB] block mb-1">
              Texto do post
            </label>
            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-2 outline-none focus:ring-1 focus:ring-[#7C3AED]"
              placeholder="Escreva ou ajuste o texto do post..."
            />
          </div>

          {/* Redes */}
          <div>
            <label className="text-[11px] text-[#E5E7EB] block mb-1">
              Redes selecionadas
            </label>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {[
                { id: "instagram", label: "Instagram" },
                { id: "facebook", label: "Facebook" },
                { id: "whatsapp", label: "WhatsApp" },
              ].map((opt) => {
                const active = networks.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleToggleNetwork(opt.id)}
                    className={`px-3 py-1 rounded-full border transition ${
                      active
                        ? "border-[#7C3AED] bg-[#7C3AED]/20 text-white"
                        : "border-[#272046] text-[#E5E7EB]/80 hover:bg-[#111827]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipo de mídia + URL */}
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <label className="text-[#E5E7EB] block mb-1">
                Tipo de mídia
              </label>
              <select
                value={mediaType}
                onChange={(e) =>
                  setMediaType(
                    e.target.value as "image" | "video" | "none",
                  )
                }
                className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
              >
                <option value="none">Sem mídia</option>
                <option value="image">Imagem</option>
                <option value="video">Vídeo</option>
              </select>
            </div>
            <div>
              <label className="text-[#E5E7EB] block mb-1">
                URL da mídia (temporário)
              </label>
              <input
                type="text"
                value={mediaUrl ?? ""}
                onChange={(e) => setMediaUrl(e.target.value || null)}
                placeholder="https://..."
                className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
              />
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-4 flex items-center justify-end gap-2 text-[11px]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full border border-[#272046] text-[#E5E7EB] hover:bg-[#111827]"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-full text-white font-medium"
            style={{
              background:
                "linear-gradient(90deg,#7C3AED 0%,#EC4899 50%,#0EA5E9 100%)",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Salvando..." : "Salvar rascunho"}
          </button>
        </div>
      </div>
    </div>
  );
}
