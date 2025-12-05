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
import { useUser } from "@/firebase/provider";
import { usePostActions } from "@/firebase/posts";
import { generateImage } from "@/ai/flows/generate-image-flow";
import { uploadBase64ImageToStorage } from "@/lib/upload-helper";
import { generateSocialMediaPost } from "@/ai/flows/generate-social-media-post";
import {
  ToneId,
  TONE_TEMPLATES,
} from "@/config/toneTemplates";
import {
  ObjectiveId,
  POST_OBJECTIVES,
} from "@/config/postObjectives";
import { POST_PRESETS, type PostPreset } from "@/config/postPresets";
import { PostNetwork } from "@/types/post";


const CARD = "#0B001F";
const BORDER = "#261341";


export default function CreatePostAIPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { user: currentUser } = useUser();
  const { createPost } = usePostActions();
  const { storage } = useFirebase();

  const workspaceId = currentWorkspace?.id;
  const ownerId = currentUser?.uid;

  const [networks, setNetworks] = useState<PostNetwork[]>(["instagram"]);
  const [theme, setTheme] = useState("");
  const [toneId, setToneId] = useState<ToneId>("engracado");
  const [objectiveId, setObjectiveId] = useState<ObjectiveId>("engajamento");

  const [mediaType, setMediaType] = useState<"image" | "video" | "none">("none");
  const [mediaSource, setMediaSource] = useState<"upload" | "ai">("upload");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const [mediaPrompt, setMediaPrompt] = useState("");
  const [loadingImage, setLoadingImage] = useState(false);

  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);


  function toggleNetwork(network: PostNetwork) {
    setNetworks((prev) =>
      prev.includes(network)
        ? prev.filter((r) => r !== network)
        : [...prev, network]
    );
  }
  
  const applyPreset = (preset: PostPreset) => {
    setToneId(preset.toneId);
    setObjectiveId(preset.objectiveId);
    setSelectedPresetId(preset.id);
  };

  async function handleGenerateText() {
    if (!theme.trim()) {
      alert("Informe pelo menos o tema da postagem para gerar com IA.");
      return;
    }
    if (networks.length === 0) {
      alert("Selecione pelo menos uma rede social.");
      return;
    }

    setLoadingText(true);
    setGeneratedText(null);

    try {
      const result = await generateSocialMediaPost({
        theme: theme,
        toneId: toneId,
        objectiveId: objectiveId,
        networks: networks,
      });

      if (!result || !result.postContent) {
        alert("A IA não conseguiu gerar o texto. Tente refinar seu tema.");
        return;
      }
      
      setGeneratedText(result.postContent);

    } catch (err) {
      console.error("[handleGenerateText] Erro:", err);
      alert("Ocorreu um erro ao gerar o texto com IA. Verifique o console.");
    } finally {
      setLoadingText(false);
    }
  }

  async function handleGenerateImage() {
    if (mediaType !== 'image' || mediaSource !== 'ai') {
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
  
    try {
      const result = await generateImage({ 
        prompt: `
          Crie uma imagem para um post de rede social com o visual do VIRALINK.

          Tema: ${theme}
          Tom de voz: ${TONE_TEMPLATES[toneId].label}
          Objetivo do post: ${POST_OBJECTIVES[objectiveId].label}
          Foco do objetivo: ${POST_OBJECTIVES[objectiveId].focoPrincipal}
          Redes: ${networks.join(", ")}

          Estilo visual:
          - Fundo escuro com acentos em roxo neon e azul (estilo dashboard de analytics).
          - Elementos que remetam a redes sociais (curtidas, comentários, gráficos de crescimento).
          - Layout limpo, com área visual que sugira espaço para texto.
          - Sensação de tecnologia, crescimento e performance.

          A imagem deve combinar com o tom de voz e o objetivo do post, reforçando a ideia principal.
          
          Prompt do usuário: "${mediaPrompt}"
        `.trim()
      });
      const { imageBase64 } = result;
  
      if (!imageBase64) {
        throw new Error('A IA não retornou uma imagem.');
      }
  
      const fullBase64 = `data:image/png;base64,${imageBase64}`;
      setMediaUrl(fullBase64); // Show preview immediately
  
      const downloadURL = await uploadBase64ImageToStorage(
        storage,
        fullBase64,
        `post-images/${ownerId}`
      );
      
      setMediaUrl(downloadURL); // Update with final storage URL
      
    } catch (error) {
      console.error('Erro ao gerar ou fazer upload da imagem:', error);
      alert('Ocorreu um erro ao gerar a imagem. Verifique o console para mais detalhes.');
      setMediaUrl(null);
    } finally {
      setLoadingImage(false);
    }
  }

  function handleClear() {
    setGeneratedText(null);
    setMediaUrl(null);
  }

  function handleBack() {
    router.push("/posts");
  }

  async function handleSaveDraft() {
    if (!workspaceId || !ownerId) {
       alert("Workspace ou usuário não identificado. Faça login novamente.");
      return;
    }
    if (!generatedText && !mediaUrl) {
      alert("Gere o texto ou adicione uma mídia antes de salvar o rascunho.");
      return;
    }

    setSaving(true);
    try {
      await createPost({
        workspaceId,
        ownerId,
        text: generatedText || "",
        mediaType: mediaType,
        mediaUrl,
        networks,
        status: "draft",
        aiToneId: toneId,
        aiObjectiveId: objectiveId,
      });
      alert("Rascunho salvo com sucesso!");
      router.push("/posts");
    } catch (err) {
      console.error("[CreatePostAIPage] erro ao salvar rascunho:", err);
      alert("Ocorreu um erro ao salvar o rascunho.");
    } finally {
      setSaving(false);
    }
  }

  const toneOptions = Object.values(TONE_TEMPLATES);
  const objectiveOptions = Object.values(POST_OBJECTIVES);

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
            Criar post com IA
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 max-w-2xl">
            Selecione as redes, peça para a IA criar o texto e, se quiser, gere
            também a imagem da postagem automaticamente.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-4">
        <div
          className="rounded-2xl p-4 md:p-5 space-y-4"
          style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
        >
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#CBD5E1]">
              Redes para publicação
            </label>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {(["instagram", "facebook", "whatsapp"] as PostNetwork[]).map(
                (network) => {
                  const ativo = networks.includes(network);
                  return (
                    <button
                      key={network}
                      type="button"
                      onClick={() => toggleNetwork(network)}
                      className={`px-3 py-1.5 rounded-full border transition ${
                        ativo
                          ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                          : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                      }`}
                    >
                      {network.charAt(0).toUpperCase() + network.slice(1)}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#CBD5E1]">
              Tema / assunto principal *
            </label>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex.: Divulgação do plano Pro para pequenos negócios"
              className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>
          
          <div className="space-y-1">
            <p className="text-[11px] text-[#E5E7EB]">
              Presets rápidos de estratégia
            </p>
            <div className="flex flex-wrap gap-2">
              {POST_PRESETS.map((preset) => {
                const isActive = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`px-3 py-1.5 rounded-full border text-[11px] text-left transition ${
                      isActive
                        ? "border-[#7C3AED] bg-[#7C3AED]/20 text-white"
                        : preset.destaque
                        ? "border-[#F97316] text-[#F97316] bg-[#0B1120]"
                        : "border-[#272046] text-[#E5E7EB]/80 bg-[#020012] hover:bg-[#111827]"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            {selectedPresetId && (
              <p className="text-[10px] text-[#9CA3AF] mt-1">
                {
                  POST_PRESETS.find((p) => p.id === selectedPresetId)
                    ?.descricao
                }
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div>
              <label className="text-[#E5E7EB] block mb-1">
                Tom de voz
              </label>
              <select
                value={toneId}
                onChange={(e) => {
                  setToneId(e.target.value as ToneId);
                  setSelectedPresetId(null);
                }}
                className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
              >
                {toneOptions.map((tone) => (
                  <option key={tone.id} value={tone.id}>
                    {tone.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-[#9CA3AF]">
                {TONE_TEMPLATES[toneId].descricao}
              </p>
            </div>

            <div>
              <label className="text-[#E5E7EB] block mb-1">
                Objetivo do post
              </label>
              <select
                value={objectiveId}
                onChange={(e) => {
                  setObjectiveId(e.target.value as ObjectiveId);
                  setSelectedPresetId(null);
                }}
                className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
              >
                {objectiveOptions.map((obj) => (
                  <option key={obj.id} value={obj.id}>
                    {obj.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-[#9CA3AF]">
                {POST_OBJECTIVES[objectiveId].descricao}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#CBD5E1]">
              Mídia do post (opcional)
            </label>
            <div className="flex flex-wrap gap-2 text-[11px] mb-1">
              <button
                type="button"
                onClick={() => {
                  setMediaType("none");
                  setMediaUrl(null);
                }}
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
                onClick={() => {
                  setMediaType("video");
                  setMediaSource("upload");
                }}
                className={`px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1 ${
                  mediaType === "video"
                    ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                    : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                }`}
              >
                <FiVideo size={12} /> Vídeo
              </button>
            </div>

            {mediaType === "image" && (
              <div className="flex flex-wrap gap-2 text-[11px] mb-2">
                <button
                  type="button"
                  onClick={() => setMediaSource("ai")}
                  className={`px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1 ${
                    mediaSource === "ai"
                      ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                      : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                  }`}
                >
                  <FiStar size={12} /> Gerar imagem com IA
                </button>
              </div>
            )}
            
            {mediaType === "image" && mediaSource === "ai" && (
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
                  onClick={handleGenerateImage}
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
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={handleGenerateText}
              disabled={loadingText}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold text-white shadow-lg disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(90deg, #7C3AED 0%, #C026D3 50%, #0EA5E9 100%)",
              }}
            >
              <FiZap size={14} />
              {loadingText ? "Gerando texto..." : "Gerar texto com IA"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-semibold border border-[#312356] text-[#E5E7EB] hover:bg-white/5 transition"
            >
              <FiRefreshCcw size={12} />
              Limpar resultado
            </button>
          </div>
        </div>

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
          <div className="rounded-2xl border border-[#261341] bg-[#050017] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#C026D3]" />
              <div className="flex flex-col">
                <span className="text-[11px] text-white font-medium">
                  {currentWorkspace?.name || "Sua Marca"}
                </span>
                <span className="text-[10px] text-[#9CA3AF]">
                  {networks.length > 0
                    ? networks.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(" • ")
                    : "Selecione uma rede"}
                </span>
              </div>
            </div>

            {mediaType !== "none" && (
              <div className="mt-2 h-40 rounded-xl bg-gradient-to-tr from-[#1F1033] to-[#020617] border border-[#261341] flex items-center justify-center text-[10px] text-[#9CA3AF] px-4 text-center">
                {mediaUrl ? (
                  <img src={mediaUrl} alt="Preview da mídia" className="max-h-full max-w-full object-contain rounded-md" />
                ) : loadingImage ? "Gerando imagem..." : "A mídia aparecerá aqui."}
              </div>
            )}

            <div className="mt-2 space-y-1">
              <p className="text-[12px] text-white whitespace-pre-wrap">
                {loadingText
                  ? "Gerando o texto com a magia do Gemini..."
                  : generatedText || "O texto gerado pela IA será exibido aqui."
                }
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 text-[11px] pt-2">
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-full border border-[#272046] text-[#9CA3AF] disabled:opacity-50"
            >
              Agendar
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || (!generatedText && !mediaUrl)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-white disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(90deg, #7C3AED 0%, #C026D3 50%, #0EA5E9 100%)",
              }}
            >
              <FiSave size={12} />
              {saving ? "Salvando..." : "Salvar Rascunho"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
