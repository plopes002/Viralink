// app/(app)/posts/ai/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiZap,
  FiRefreshCcw,
  FiImage,
  FiVideo,
  FiStar,
  FiSave,
} from "react-icons/fi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useDraftPostActions, MediaType } from "@/hooks/useDraftPostActions";
import { useUser, useFirebase } from "@/firebase/provider";
import { generateImage } from "@/ai/flows/generate-image-flow";
import { uploadBase64ImageToStorage } from "@/lib/upload-helper";
import { generateSocialMediaPost } from "@/ai/flows/generate-social-media-post";


const CARD = "#0B001F";
const BORDER = "#261341";

const TONS_PREDEFINIDOS = [
  "Profissional, mas próximo",
  "Descontraído e divertido",
  "Direto ao ponto",
  "Educativo e didático",
  "Inspirador / motivacional",
  "Urgente (escassez / oferta relâmpago)",
];

export default function CreatePostAIPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { user: currentUser } = useUser();
  const { firestore, storage } = useFirebase();

  const { createDraft } = useDraftPostActions();

  const workspaceId = currentWorkspace?.id;
  const ownerId = currentUser?.uid;

  // Redes (multi-seleção)
  const [redesSelecionadas, setRedesSelecionadas] = useState<string[]>([
    "instagram",
  ]);

  // Texto / parâmetros
  const [tema, setTema] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [publico, setPublico] = useState("");
  const [cta, setCta] = useState("Envie uma mensagem ou clique no link da bio.");

  // Tom de voz
  const [tomSelecionado, setTomSelecionado] = useState<string>(
    TONS_PREDEFINIDOS[0],
  );
  const [tomPersonalizado, setTomPersonalizado] = useState("");

  const [comprimento, setComprimento] = useState<"curto" | "medio" | "longo">(
    "medio",
  );

  // MÍDIA
  const [mediaKind, setMediaKind] = useState<MediaType>("none");
  const [mediaSource, setMediaSource] = useState<"upload" | "ai">("upload");
  const [mediaFileName, setMediaFileName] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  // Prompt para imagem IA
  const [mediaPrompt, setMediaPrompt] = useState("");
  const [imageGenerated, setImageGenerated] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  // Resultado IA de texto
  const [tituloGerado, setTituloGerado] = useState<string | null>(null);
  const [textoGerado, setTextoGerado] = useState<string | null>(null);
  const [hashtagsGeradas, setHashtagsGeradas] = useState<string[] | null>(null);
  const [loadingTexto, setLoadingTexto] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);


  function toggleRede(rede: string) {
    setRedesSelecionadas((atual) =>
      atual.includes(rede)
        ? atual.filter((r) => r !== rede)
        : [...atual, rede],
    );
  }

  const tomFinal =
    tomSelecionado === "Outro (personalizar)"
      ? tomPersonalizado || "Tom personalizado definido pelo usuário"
      : tomSelecionado;

  async function handleGerarTextoIA() {
    if (!tema.trim()) {
      alert("Informe pelo menos o tema da postagem para gerar com IA.");
      return;
    }
    if (redesSelecionadas.length === 0) {
      alert("Selecione pelo menos uma rede social.");
      return;
    }

    setLoadingTexto(true);
    setTextoGerado(null);

    try {
      const result = await generateSocialMediaPost({
        theme: tema,
        tone: tomFinal,
        networks: redesSelecionadas,
      });

      if (!result || !result.postContent) {
        alert("A IA não conseguiu gerar o texto. Tente refinar seu tema.");
        return;
      }
      
      setTextoGerado(result.postContent);
      setTituloGerado(null); // O novo flow não gera mais título separado
      setHashtagsGeradas(null); // O novo flow não gera mais hashtags

    } catch (err) {
      console.error("[handleGerarTextoIA] Erro:", err);
      alert("Ocorreu um erro ao gerar o texto com IA. Verifique o console.");
    } finally {
      setLoadingTexto(false);
    }
  }

  async function handleGerarImagemIA() {
    if (mediaKind !== 'image' || mediaSource !== 'ai') {
      alert('Selecione "Imagem" e "Gerar com IA" para usar esta função.');
      return;
    }
    if (!mediaPrompt.trim()) {
      alert('Descreva a imagem que você quer gerar.');
      return;
    }
    if (!storage || !ownerId) {
      alert('Serviço de armazenamento ou usuário não disponível. Tente novamente.');
      return;
    }
  
    setLoadingImage(true);
    setMediaUrl(null);
    setImageGenerated(false);
  
    try {
      const result = await generateImage({ prompt: mediaPrompt });
      const { imageBase64 } = result;
  
      if (!imageBase64) {
        throw new Error('A IA não retornou uma imagem.');
      }
  
      const fullBase64 = `data:image/png;base64,${imageBase64}`;
      setMediaUrl(fullBase64); // Show preview immediately
      setImageGenerated(true);
  
      const downloadURL = await uploadBase64ImageToStorage(
        storage,
        fullBase64,
        `draft-images/${ownerId}`
      );
      
      setMediaUrl(downloadURL); // Update with final storage URL
      setMediaFileName("imagem-gerada-pela-IA.png");
      
    } catch (error) {
      console.error('Erro ao gerar ou fazer upload da imagem:', error);
      alert('Ocorreu um erro ao gerar a imagem. Verifique o console para mais detalhes.');
      setMediaUrl(null);
    } finally {
      setLoadingImage(false);
    }
  }

  function handleLimpar() {
    setTituloGerado(null);
    setTextoGerado(null);
    setHashtagsGeradas(null);
    setImageGenerated(false);
    setMediaFileName(null);
    setMediaUrl(null);
  }

  function handleVoltar() {
    router.push("/posts");
  }

  function handleChangeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setMediaFileName(file ? file.name : null);
    setImageGenerated(false);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setMediaUrl(null);
    }
  }

  async function handleSaveDraft() {
    if (!workspaceId || !ownerId) {
       alert("Workspace ou usuário não identificado. Faça login novamente.");
      return;
    }
    if (!textoGerado && !mediaUrl) {
      alert("Gere o texto ou adicione uma mídia antes de salvar o rascunho.");
      return;
    }

    try {
      setSavingDraft(true);
      await createDraft({
        workspaceId,
        ownerId,
        networks: redesSelecionadas,
        text: textoGerado || "",
        mediaType: mediaKind,
        mediaUrl,
      });
      alert("Rascunho salvo com sucesso!");
      router.push("/posts");
    } catch (err) {
      console.error("[NovoPostIaPage] erro ao salvar rascunho:", err);
      alert("Ocorreu um erro ao salvar o rascunho.");
    } finally {
      setSavingDraft(false);
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
            Criar post com IA
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 max-w-2xl">
            Selecione as redes, peça para a IA criar o texto e, se quiser, gere
            também a imagem da postagem automaticamente.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-4">
        {/* FORM */}
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
                {id: "instagram", label: "Instagram"}, 
                {id: "facebook", label: "Facebook"}, 
                {id: "whatsapp", label: "WhatsApp"}
              ]).map(
                (rede) => {
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
                },
              )}
            </div>
            <p className="text-[10px] text-[#6B7280]">
              • Um único conteúdo será reutilizado em todas as redes
              selecionadas.
            </p>
          </div>

          {/* Tema */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#CBD5E1]">
              Tema / assunto principal *
            </label>
            <input
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex.: Divulgação do plano Pro para pequenos negócios"
              className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>

          {/* Objetivo */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#CBD5E1]">
              Objetivo da postagem
            </label>
            <input
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Ex.: Gerar leads para teste gratuito, reforçar autoridade, etc."
              className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>

          {/* Tom de voz */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-[#CBD5E1]">Tom de voz</label>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {TONS_PREDEFINIDOS.map((ton) => (
                <button
                  key={ton}
                  type="button"
                  onClick={() => setTomSelecionado(ton)}
                  className={`px-3 py-1.5 rounded-full border transition ${
                    tomSelecionado === ton
                      ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                      : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                  }`}
                >
                  {ton}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTomSelecionado("Outro (personalizar)")}
                className={`px-3 py-1.5 rounded-full border transition ${
                  tomSelecionado === "Outro (personalizar)"
                    ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                    : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                }`}
              >
                Outro (personalizar)
              </button>
            </div>

            {tomSelecionado === "Outro (personalizar)" && (
              <input
                value={tomPersonalizado}
                onChange={(e) => setTomPersonalizado(e.target.value)}
                placeholder="Descreva o tom de voz desejado (ex.: sarcástico, técnico, super informal...)"
                className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              />
            )}
          </div>

          {/* Público */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#CBD5E1]">
              Público-alvo (opcional)
            </label>
            <input
              value={publico}
              onChange={(e) => setPublico(e.target.value)}
              placeholder="Ex.: Donos de pequenas clínicas, infoprodutores, etc."
              className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#CBD5E1]">
              Chamada para ação (CTA)
            </label>
            <textarea
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              rows={2}
              className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>

          {/* Comprimento */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[#CBD5E1]">Comprimento</span>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {[
                { key: "curto", label: "Curto" },
                { key: "medio", label: "Médio" },
                { key: "longo", label: "Longo" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() =>
                    setComprimento(opt.key as typeof comprimento)
                  }
                  className={`px-3 py-1.5 rounded-full border transition ${
                    comprimento === opt.key
                      ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                      : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                  }`}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* MÍDIA: upload ou IA */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#CBD5E1]">
              Mídia do post (opcional)
            </label>

            {/* Escolha tipo (none / image / video) */}
            <div className="flex flex-wrap gap-2 text-[11px] mb-1">
              <button
                type="button"
                onClick={() => {
                  setMediaKind("none");
                  setMediaFileName(null);
                  setImageGenerated(false);
                }}
                className={`px-3 py-1.5 rounded-full border transition ${
                  mediaKind === "none"
                    ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                    : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                }`}
              >
                Sem mídia
              </button>
              <button
                type="button"
                onClick={() => setMediaKind("image")}
                className={`px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1 ${
                  mediaKind === "image"
                    ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                    : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                }`}
              >
                <FiImage size={12} />
                Imagem
              </button>
              <button
                type="button"
                onClick={() => {
                  setMediaKind("video");
                  setMediaSource("upload");
                  setImageGenerated(false);
                }}
                className={`px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1 ${
                  mediaKind === "video"
                    ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                    : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                }`}
              >
                <FiVideo size={12} />
                Vídeo
              </button>
            </div>

            {/* Fonte da mídia */}
            {mediaKind === "image" && (
              <div className="flex flex-wrap gap-2 text-[11px] mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setMediaSource("upload");
                    setImageGenerated(false);
                  }}
                  className={`px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1 ${
                    mediaSource === "upload"
                      ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                      : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                  }`}
                >
                  Upload de imagem
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMediaSource("ai");
                    setMediaFileName(null);
                  }}
                  className={`px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1 ${
                    mediaSource === "ai"
                      ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                      : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                  }`}
                >
                  <FiStar size={12} />
                  Gerar imagem com IA
                </button>
              </div>
            )}

            {/* Upload */}
            {mediaKind !== "none" && mediaSource === "upload" && (
              <input
                type="file"
                accept={mediaKind === "image" ? "image/*" : "video/*"}
                onChange={handleChangeUpload}
                className="text-[11px] text-[#CBD5E1]"
              />
            )}

            {/* Prompt de imagem IA */}
            {mediaKind === "image" && mediaSource === "ai" && (
              <div className="flex flex-col gap-1 mt-1">
                <textarea
                  value={mediaPrompt}
                  onChange={(e) => setMediaPrompt(e.target.value)}
                  rows={3}
                  placeholder="Descreva a imagem que deseja (ex.: carrossel com fundo roxo neon, ícones de redes sociais e clima futurista)."
                  className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
                <button
                  type="button"
                  onClick={handleGerarImagemIA}
                  disabled={loadingImage}
                  className="inline-flex items-center gap-2 px-3 py-1.5 mt-1 rounded-full text-[11px] font-semibold text-white disabled:opacity-60"
                  style={{
                    background:
                      "linear-gradient(90deg, #7C3AED 0%, #C026D3 50%, #0EA5E9 100%)",
                  }}
                >
                  <FiStar size={12} />
                  {loadingImage ? "Gerando imagem..." : "Gerar imagem com IA"}
                </button>
              </div>
            )}

            {mediaFileName && (
              <p className="text-[10px] text-[#9CA3AF] mt-1">
                Arquivo selecionado: {mediaFileName}
                {imageGenerated && " (gerado pela IA)"}
              </p>
            )}
          </div>

          {/* AÇÕES TEXTO */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={handleGerarTextoIA}
              disabled={loadingTexto}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold text-white shadow-lg disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(90deg, #7C3AED 0%, #C026D3 50%, #0EA5E9 100%)",
              }}
            >
              <FiZap size={14} />
              {loadingTexto ? "Gerando texto..." : "Gerar texto com IA"}
            </button>
            <button
              type="button"
              onClick={handleLimpar}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-semibold border border-[#312356] text-[#E5E7EB] hover:bg-white/5 transition"
            >
              <FiRefreshCcw size={12} />
              Limpar resultado
            </button>
          </div>
        </div>

        {/* PREVIEW */}
        <div
          className="rounded-2xl p-4 md:p-5 space-y-3"
          style={{
            backgroundColor: CARD,
            border: `1px solid ${BORDER}`,
          }}
        >
          <h2 className="text-sm font-semibold text-white mb-1.5">
            Preview da postagem
          </h2>
          <p className="text-[11px] text-[#9CA3AF] mb-2">
            Visualização aproximada de como o conteúdo será usado nas redes
            selecionadas.
          </p>

          <div className="rounded-2xl border border-[#261341] bg-[#050017] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#C026D3]" />
              <div className="flex flex-col">
                <span className="text-[11px] text-white font-medium">
                  Agência Digital Exemplo
                </span>
                <span className="text-[10px] text-[#9CA3AF]">
                  {redesSelecionadas.length > 0
                    ? redesSelecionadas.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(" • ")
                    : "Selecione pelo menos uma rede"}
                </span>
              </div>
            </div>

            {mediaKind !== "none" && (
              <div className="mt-2 h-28 rounded-xl bg-gradient-to-tr from-[#1F1033] to-[#020617] border border-[#261341] flex items-center justify-center text-[10px] text-[#9CA3AF] px-4 text-center">
                {mediaUrl ? (
                  <img src={mediaUrl} alt="Preview da mídia" className="max-h-full max-w-full object-contain rounded-md" />
                ) : mediaKind === "image" && mediaSource === "ai" ? (
                  <>A imagem gerada pela IA aparecerá aqui após a geração.</>
                ) : (
                  <>Área reservada para a mídia deste post.</>
                )}
              </div>
            )}

            <div className="mt-2 space-y-1">
              <p className="text-[12px] text-white whitespace-pre-wrap">
                {loadingTexto
                  ? "Gerando o texto com a magia do Gemini..."
                  : textoGerado || "Após gerar com IA, o texto completo da legenda será exibido aqui para revisão."
                }
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 text-[11px] pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-full border border-[#272046] text-[#E5E7EB] hover:bg-[#111827]"
            >
              Publicar / Agendar
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savingDraft || !textoGerado}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-white disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(90deg, #7C3AED 0%, #C026D3 50%, #0EA5E9 100%)",
              }}
            >
              <FiSave size={12} />
              {savingDraft ? "Salvando..." : "Salvar como rascunho"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
