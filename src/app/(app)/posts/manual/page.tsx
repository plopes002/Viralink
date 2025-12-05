// app/(app)/posts/manual/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiSave,
  FiImage,
  FiVideo,
} from "react-icons/fi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUser } from "@/firebase/provider";
import { usePostActions } from "@/firebase/posts";
import type { PostNetwork } from "@/types/post";

const CARD = "#0B001F";
const BORDER = "#261341";

export default function CreatePostManualPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { user: currentUser } = useUser();
  const { createPost } = usePostActions();

  const workspaceId = currentWorkspace?.id;
  const ownerId = currentUser?.uid;

  const [networks, setNetworks] = useState<PostNetwork[]>(["instagram"]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [mediaType, setMediaType] = useState<"image" | "video" | "none">("none");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleNetwork(network: PostNetwork) {
    setNetworks((prev) =>
      prev.includes(network)
        ? prev.filter((n) => n !== network)
        : [...prev, network]
    );
  }

  function handleBack() {
    router.push("/posts");
  }

  async function handleSave(status: "draft" | "scheduled") {
    if (!workspaceId || !ownerId) {
      alert("Workspace ou usuário não identificado. Faça login novamente.");
      return;
    }
    if (!text.trim() && !mediaUrl) {
      alert("Adicione texto ou uma mídia antes de salvar.");
      return;
    }
    if (status === "scheduled" && (!date || !time)) {
      alert("Para agendar, você precisa definir a data e a hora.");
      return;
    }

    setSaving(true);
    try {
      let scheduledAt: string | null = null;
      if (status === "scheduled" && date && time) {
        // Assume date is 'YYYY-MM-DD' and time is 'HH:mm'
        scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      }

      await createPost({
        workspaceId,
        ownerId,
        title,
        text,
        mediaType,
        mediaUrl,
        networks,
        status,
        scheduledAt,
      });

      alert(`Post salvo como ${status === 'draft' ? 'rascunho' : 'agendado'}!`);
      router.push("/posts");
    } catch (err) {
      console.error("[CreatePostManualPage] erro ao salvar post:", err);
      alert("Ocorreu um erro ao salvar o post.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-4 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-[11px] text-[#9CA3AF] mb-2 hover:text-[#E5E7EB]"
          >
            <FiArrowLeft size={12} />
            Voltar para Posts & Agenda
          </button>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Novo post manual
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 max-w-2xl">
            Crie um post do zero, selecione uma ou mais redes, anexe imagem ou
            vídeo e escolha se quer publicar agora ou agendar.
          </p>
        </div>
      </header>

      <div
        className="rounded-2xl p-4 md:p-5 space-y-4"
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      >
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#CBD5E1]">
            Redes para publicação
          </label>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {(["instagram", "facebook", "whatsapp"] as PostNetwork[]).map((network) => (
              <button
                key={network}
                type="button"
                onClick={() => toggleNetwork(network)}
                className={`px-3 py-1.5 rounded-full border transition ${
                  networks.includes(network)
                    ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                    : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                }`}
              >
                {network.charAt(0).toUpperCase() + network.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#CBD5E1]">
            Título interno (opcional)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Post de oferta relâmpago - 15/03"
            className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#CBD5E1]">
            Texto / legenda da postagem *
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Escreva aqui a legenda completa que será publicada nas redes selecionadas."
            className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#CBD5E1]">Mídia</label>
          <div className="flex flex-wrap gap-2 text-[11px] mb-1">
             <button
              type="button"
              onClick={() => setMediaType("none")}
              className={`px-3 py-1.5 rounded-full border transition ${
                mediaType === "none"
                  ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                  : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
              }`}
            >
              Sem mídia
            </button>
            <button
              type="button"
              onClick={() => setMediaType("image")}
              className={`px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1 ${
                mediaType === "image"
                  ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                  : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
              }`}
            >
              <FiImage size={12} /> Imagem
            </button>
            <button
              type="button"
              onClick={() => setMediaType("video")}
              className={`px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1 ${
                mediaType === "video"
                  ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                  : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
              }`}
            >
              <FiVideo size={12} /> Vídeo
            </button>
          </div>
          {mediaType !== 'none' && (
             <input
              type="text"
              value={mediaUrl ?? ''}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://url_da_imagem_ou_video"
              className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] text-[#CBD5E1]">Publicação</span>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setIsScheduling(false)}
              className={`px-3 py-1.5 rounded-full border transition ${
                !isScheduling
                  ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                  : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
              }`}
            >
              Salvar como Rascunho
            </button>
            <button
              type="button"
              onClick={() => setIsScheduling(true)}
              className={`px-3 py-1.5 rounded-full border transition ${
                isScheduling
                  ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                  : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
              }`}
            >
              Agendar Publicação
            </button>
          </div>
          {isScheduling && (
            <div className="flex flex-wrap gap-3 mt-1 text-[11px]">
              <div className="flex items-center gap-2">
                <FiCalendar size={12} className="text-[#9CA3AF]" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-[11px] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div className="flex items-center gap-2">
                <FiClock size={12} className="text-[#9CA3AF]" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-[11px] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => handleSave(isScheduling ? 'scheduled' : 'draft')}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white shadow-lg disabled:opacity-50"
            style={{
              background:
                "linear-gradient(90deg, #7C3AED 0%, #C026D3 50%, #0EA5E9 100%)",
            }}
          >
            <FiSave size={14} />
            {saving ? 'Salvando...' : (isScheduling ? 'Agendar Post' : 'Salvar Rascunho')}
          </button>
        </div>
      </div>
    </section>
  );
}
