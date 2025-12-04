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
} from "react-icons/fi";

const CARD = "#0B001F";
const BORDER = "#261341";

type Rede = "Instagram" | "Facebook" | "WhatsApp";

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

  // Redes
  const [redesSelecionadas, setRedesSelecionadas] = useState<Rede[]>([
    "Instagram",
  ]);

  // Campos de texto
  const [tema, setTema] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [publico, setPublico] = useState("");
  const [cta, setCta] = useState("Envie uma mensagem ou clique no link da bio.");

  // Tom de voz (lista + personalizado)
  const [tomSelecionado, setTomSelecionado] = useState<string>(
    TONS_PREDEFINIDOS[0],
  );
  const [tomPersonalizado, setTomPersonalizado] = useState("");

  // Comprimento
  const [comprimento, setComprimento] = useState<"curto" | "medio" | "longo">(
    "medio",
  );

  // Mídia
  const [tipoMidia, setTipoMidia] = useState<"nenhuma" | "imagem" | "video">(
    "nenhuma",
  );
  const [midiaArquivoNome, setMidiaArquivoNome] = useState<string | null>(null);

  // Resultado IA
  const [tituloGerado, setTituloGerado] = useState<string | null>(null);
  const [textoGerado, setTextoGerado] = useState<string | null>(null);
  const [hashtagsGeradas, setHashtagsGeradas] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleRede(rede: Rede) {
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

  function handleGerarComIA() {
    if (!tema.trim()) {
      alert("Informe pelo menos o tema da postagem para gerar com IA.");
      return;
    }
    if (redesSelecionadas.length === 0) {
      alert("Selecione pelo menos uma rede social.");
      return;
    }

    setLoading(true);

    // 🔮 Aqui você vai chamar sua função de IA / Cloud Function / API externa
    setTimeout(() => {
      const redesStr = redesSelecionadas.join(", ");

      const fakeTitulo = `🚀 ${tema} — destaque para ${redesStr}`;
      const fakeTexto =
        `Post criado para ${redesStr}. ` +
        `Objetivo: ${objetivo || "gerar engajamento e conversões"}. ` +
        `Tom de voz: ${tomFinal}. ` +
        (publico
          ? `Focado em: ${publico}. `
          : "Focado no seu público ideal. ") +
        `CTA: ${cta}`;

      const fakeHashtags = [
        "#viralink",
        "#socialmedia",
        "#marketingdigital",
        "#engajamento",
      ];

      setTituloGerado(fakeTitulo);
      setTextoGerado(fakeTexto);
      setHashtagsGeradas(fakeHashtags);
      setLoading(false);
    }, 600);
  }

  function handleLimpar() {
    setTituloGerado(null);
    setTextoGerado(null);
    setHashtagsGeradas(null);
  }

  function handleVoltar() {
    router.push("/posts");
  }

  function handleChangeMidia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setMidiaArquivoNome(file ? file.name : null);

    // 👉 Em produção: subir para Firebase Storage e guardar a URL no Firestore
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
            Selecione as redes, defina tema, objetivo e tom de voz. O VIRALINK
            gera título, legenda e hashtags para você usar em uma ou várias
            redes ao mesmo tempo.
          </p>
        </div>
      </header>

      {/* Form + preview */}
      <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-4">
        {/* Formulário */}
        <div
          className="rounded-2xl p-4 md:p-5 space-y-4"
          style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
        >
          {/* Redes (multi-seleção) */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#CBD5E1]">
              Em quais redes esse post será publicado?
            </label>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {(["Instagram", "Facebook", "WhatsApp"] as Rede[]).map(
                (rede) => {
                  const ativo = redesSelecionadas.includes(rede);
                  return (
                    <button
                      key={rede}
                      type="button"
                      onClick={() => toggleRede(rede)}
                      className={`px-3 py-1.5 rounded-full border transition ${
                        ativo
                          ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                          : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                      }`}
                    >
                      {rede}
                    </button>
                  );
                },
              )}
            </div>
            <p className="text-[10px] text-[#6B7280]">
              • Você poderá salvar um único texto e reutilizar em todas as
              redes selecionadas.
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

          {/* Tom de voz – lista + personalizado */}
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

          {/* Público-alvo */}
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

          {/* Mídia (imagem/vídeo) */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#CBD5E1]">
              Mídia do post (opcional)
            </label>
            <div className="flex flex-wrap gap-2 text-[11px] mb-1">
              <button
                type="button"
                onClick={() => setTipoMidia("nenhuma")}
                className={`px-3 py-1.5 rounded-full border transition ${
                  tipoMidia === "nenhuma"
                    ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                    : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                }`}
              >
                Sem mídia
              </button>
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
            </div>

            {tipoMidia !== "nenhuma" && (
              <div className="flex items-center gap-2 text-[11px]">
                <input
                  type="file"
                  accept={tipoMidia === "imagem" ? "image/*" : "video/*"}
                  onChange={handleChangeMidia}
                  className="text-[11px] text-[#CBD5E1]"
                />
              </div>
            )}
            {midiaArquivoNome && (
              <p className="text-[10px] text-[#9CA3AF]">
                Arquivo selecionado: {midiaArquivoNome}
              </p>
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={handleGerarComIA}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold text-white shadow-lg disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(90deg, #7C3AED 0%, #C026D3 50%, #0EA5E9 100%)",
              }}
            >
              <FiZap size={14} />
              {loading ? "Gerando..." : "Gerar com IA"}
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

          <p className="text-[10px] text-[#6B7280] pt-1">
            • Em produção, você vai enviar esses dados para uma Cloud Function /
            API de IA e salvar o rascunho no Firestore (um único post ligado às
            redes selecionadas).
          </p>
        </div>

        {/* Preview */}
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
                    ? redesSelecionadas.join(" • ")
                    : "Selecione pelo menos uma rede"}
                </span>
              </div>
            </div>

            {tipoMidia !== "nenhuma" && (
              <div className="mt-2 h-28 rounded-xl bg-gradient-to-tr from-[#1F1033] to-[#020617] border border-[#261341] flex items-center justify-center text-[10px] text-[#9CA3AF]">
                {midiaArquivoNome
                  ? `Preview de ${tipoMidia}: ${midiaArquivoNome}`
                  : `Área reservada para ${tipoMidia} desse post`}
              </div>
            )}

            <div className="mt-2 space-y-1">
              <p className="text-[12px] text-white font-semibold">
                {tituloGerado || "O título gerado aparecerá aqui."}
              </p>
              <p className="text-[11px] text-[#CBD5E1]">
                {textoGerado ||
                  "Após gerar com IA, o texto completo da legenda será exibido aqui para revisão."}
              </p>
              {hashtagsGeradas && hashtagsGeradas.length > 0 && (
                <p className="text-[11px] text-[#C4B5FD]">
                  {hashtagsGeradas.join(" ")}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            className="mt-2 w-full rounded-full border border-[#7C3AED] text-[#7C3AED] text-[11px] font-semibold py-2 hover:bg-[#7C3AED]/10 transition"
          >
            Salvar como rascunho &gt;
          </button>

          <p className="text-[10px] text-[#6B7280]">
            • Quando integrar com o backend, esse botão vai criar um documento
            na coleção <span className="text-[#C4B5FD] font-mono">posts</span>,
            com links das mídias no Storage e uma lista de redes onde será
            publicado.
          </p>
        </div>
      </div>
    </section>
  );
}
