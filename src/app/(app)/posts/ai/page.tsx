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
import {
  ToneId,
  TONE_TEMPLATES,
} from "@/config/toneTemplates";
import {
  ObjectiveId,
  POST_OBJECTIVES,
} from "@/config/postObjectives";


const CARD = "#0B001F";
const BORDER = "#261341";


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
  const [toneId, setToneId] = useState<ToneId>("engracado");
  const [objectiveId, setObjectiveId] = useState<ObjectiveId>("engajamento");
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
        toneId: toneId,
        objectiveId: objectiveId,
        networks: redesSelecionadas,
      });

      if (!result || !result.postContent) {
        alert("A IA não conseguiu gerar o texto. Tente refinar seu tema.");
        return;
      }
      
      setTextoGerado(result.postContent);

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
      const result = await generateImage({ 
        prompt: `
          Crie uma imagem para um post de rede social com o visual do VIRALINK.

          Tema: ${tema}
          Tom de voz: ${TONE_TEMPLATES[toneId].label}
          Objetivo do post: ${POST_OBJECTIVES[objectiveId].label}
          Foco do objetivo: ${POST_OBJECTIVES[objectiveId].focoPrincipal}
          Redes: ${redesSelecionadas.join(", ")}

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

  const toneOptions = Object.values(TONE_TEMPLATES);
  const objectiveOptions = Object.values(POST_OBJECTIVES);

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
          
          {/* Tom de voz + Objetivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div>
              <label className="text-[#E5E7EB] block mb-1">
                Tom de voz
              </label>
              <select
                value={toneId}
                onChange={(e) => setToneId(e.target.value as ToneId)}
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
                onChange={(e) =>
                  setObjectiveId(e.target.value as ObjectiveId)
                }
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
