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
import { useDraftPostActions, MediaType } from "@/hooks/useDraftPostActions";
import { useUser } from "@/firebase/provider";


const CARD = "#0B001F";
const BORDER = "#261341";

type Rede = "Instagram" | "Facebook" | "WhatsApp";

export default function CreatePostManualPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { user: currentUser } = useUser();
  const { createDraft } = useDraftPostActions();

  const workspaceId = currentWorkspace?.id;
  const ownerId = currentUser?.uid;

  const [redesSelecionadas, setRedesSelecionadas] = useState<string[]>([
    "instagram",
  ]);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [publicarAgora, setPublicarAgora] = useState(true);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");

  const [tipoMidia, setTipoMidia] = useState<MediaType>("image");
  const [midiaArquivoNome, setMidiaArquivoNome] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  function toggleRede(rede: string) {
    setRedesSelecionadas((atual) =>
      atual.includes(rede)
        ? atual.filter((r) => r !== rede)
        : [...atual, rede],
    );
  }

  function handleVoltar() {
    router.push("/posts");
  }

  async function handleSaveDraft() {
    if (!workspaceId || !ownerId) {
      alert("Workspace ou usuário não identificado. Faça login novamente.");
      return;
    }
    if (!conteudo.trim() && !mediaUrl) {
      alert("Adicione texto ou uma mídia antes de salvar o rascunho.");
      return;
    }

    try {
      setSavingDraft(true);
      await createDraft({
        workspaceId,
        ownerId,
        networks: redesSelecionadas,
        text: conteudo,
        mediaType: tipoMidia,
        mediaUrl,
      });
      alert("Rascunho salvo com sucesso!");
      router.push("/posts");
    } catch (err) {
      console.error("[NovoPostManualPage] erro ao salvar rascunho:", err);
      alert("Ocorreu um erro ao salvar o rascunho.");
    } finally {
      setSavingDraft(false);
    }
  }

  function handleChangeMidia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setMidiaArquivoNome(file ? file.name : null);
    // Em produção, você faria o upload para o Firebase Storage aqui
    // e setaria a URL retornada em `setMediaUrl`.
    // Por enquanto, vamos simular com uma URL de placeholder.
    if (file) {
      setMediaUrl(`https://placehold.co/600x400?text=${file.name}`);
    } else {
      setMediaUrl(null);
    }
  }

  return (
    <section className="mt-4 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <button
            onClick={handleVoltar}
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

      {/* Form */}
      <div
        className="rounded-2xl p-4 md:p-5 space-y-4"
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      >
        {/* Redes */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#CBD5E1]">
            Em quais redes esse post será publicado?
          </label>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {([
              { id: "instagram", label: "Instagram" },
              { id: "facebook", label: "Facebook" },
              { id: "whatsapp", label: "WhatsApp" },
            ]).map((rede) => {
              const ativo = redesSelecionadas.includes(rede.id);
              return (
                <button
                  key={rede.id}
                  type="button"
                  onClick={() => toggleRede(rede.id)}
                  className={`px-3 py-1.5 rounded-full border transition ${
                    ativo
                      ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                      : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                  }`}
                >
                  {rede.label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[#6B7280]">
            • Um único conteúdo poderá ser usado em todas as redes selecionadas.
          </p>
        </div>

        {/* Título interno */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#CBD5E1]">
            Título interno (opcional)
          </label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Post de oferta relâmpago - 15/03"
            className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          />
          <p className="text-[10px] text-[#6B7280]">
            • Apenas para sua organização. Não aparece nas redes.
          </p>
        </div>

        {/* Texto / legenda */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#CBD5E1]">
            Texto / legenda da postagem *
          </label>
          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={6}
            placeholder="Escreva aqui a legenda completa que será publicada nas redes selecionadas."
            className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          />
        </div>

        {/* Mídia */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#CBD5E1]">
            Mídia (imagem ou vídeo)
          </label>
          <div className="flex flex-wrap gap-2 text-[11px] mb-1">
            <button
              type="button"
              onClick={() => setTipoMidia("imagem")}
              className={`px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1 ${
                tipoMidia === "imagem"
                  ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                  : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
              }`}
            >
              <FiImage size={12} />
              Imagem
            </button>
            <button
              type="button"
              onClick={() => setTipoMidia("video")}
              className={`px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1 ${
                tipoMidia === "video"
                  ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                  : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
              }`}
            >
              <FiVideo size={12} />
              Vídeo
            </button>
            <button
              type="button"
              onClick={() => setTipoMidia("none")}
              className={`px-3 py-1.5 rounded-full border transition ${
                tipoMidia === "none"
                  ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                  : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
              }`}
            >
              Sem mídia
            </button>
          </div>

          {tipoMidia !== "none" && (
            <input
              type="file"
              accept={tipoMidia === "imagem" ? "image/*" : "video/*"}
              onChange={handleChangeMidia}
              className="text-[11px] text-[#CBD5E1]"
            />
          )}
          {midiaArquivoNome && (
            <p className="text-[10px] text-[#9CA3AF]">
              Arquivo selecionado: {midiaArquivoNome}
            </p>
          )}
        </div>

        {/* Publicação / agendamento */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] text-[#CBD5E1]">Publicação</span>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setPublicarAgora(true)}
              className={`px-3 py-1.5 rounded-full border transition ${
                publicarAgora
                  ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                  : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
              }`}
            >
              Publicar agora
            </button>
            <button
              type="button"
              onClick={() => setPublicarAgora(false)}
              className={`px-3 py-1.5 rounded-full border transition ${
                !publicarAgora
                  ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                  : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
              }`}
            >
              Agendar data e horário
            </button>
          </div>

          {!publicarAgora && (
            <div className="flex flex-wrap gap-3 mt-1 text-[11px]">
              <div className="flex items-center gap-2">
                <FiCalendar size={12} className="text-[#9CA3AF]" />
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-[11px] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <div className="flex items-center gap-2">
                <FiClock size={12} className="text-[#9CA3AF]" />
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-[11px] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-[#312356] text-[#E5E7EB] hover:bg-white/5 transition disabled:opacity-50"
          >
            <FiSave size={14} />
            {savingDraft ? "Salvando..." : "Salvar como rascunho"}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white shadow-lg"
            style={{
              background:
                "linear-gradient(90deg, #7C3AED 0%, #C026D3 50%, #0EA5E9 100%)",
            }}
          >
            {publicarAgora ? "Publicar agora" : "Agendar post"}
          </button>
        </div>
      </div>
    </section>
  );
}
