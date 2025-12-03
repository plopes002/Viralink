// app/(app)/posts/ai/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiZap, FiRefreshCcw } from "react-icons/fi";

const CARD = "#0B001F";
const BORDER = "#261341";

export default function CreatePostAIPage() {
  const router = useRouter();

  const [rede, setRede] = useState<"Instagram" | "Facebook" | "WhatsApp">(
    "Instagram",
  );
  const [tema, setTema] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [tom, setTom] = useState("Profissional, mas próximo");
  const [publico, setPublico] = useState("");
  const [cta, setCta] = useState("Envie uma mensagem ou clique no link da bio.");
  const [comprimento, setComprimento] = useState<"curto" | "medio" | "longo">(
    "medio",
  );
  const [hashtagAuto, setHashtagAuto] = useState(true);

  const [tituloGerado, setTituloGerado] = useState<string | null>(null);
  const [textoGerado, setTextoGerado] = useState<string | null>(null);
  const [hashtagsGeradas, setHashtagsGeradas] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  function handleGerarComIA() {
    if (!tema.trim()) {
      alert("Informe pelo menos o tema da postagem para gerar com IA.");
      return;
    }

    setLoading(true);

    // 🔮 Aqui você vai chamar sua função de IA / Cloud Function / Firestore
    // Por enquanto, simulamos localmente:
    setTimeout(() => {
      const fakeTitulo = `🚀 ${tema} — destaque ${rede}`;
      const fakeTexto =
        `Imagine um post perfeito sobre "${tema}" pensado para ` +
        `${publico || "seu público ideal"}, com foco em ${objetivo ||
          "gerar engajamento e conversões"}. ` +
        `No tom ${tom.toLowerCase()}, conectando com a audiência e levando ao seguinte próximo passo: ${cta}`;

      const fakeHashtags = hashtagAuto
        ? ["#viralink", "#socialmedia", "#marketingdigital", "#engajamento"]
        : [];

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
            Descreva o tema, objetivo e público. O VIRALINK gera automaticamente
            título, legenda e hashtags prontas para postar.
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
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#CBD5E1]">Rede social</label>
            <select
              value={rede}
              onChange={(e) =>
                setRede(e.target.value as typeof rede)
              }
              className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            >
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
          </div>

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

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#CBD5E1]">Tom de voz</label>
            <input
              value={tom}
              onChange={(e) => setTom(e.target.value)}
              className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>

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

          <div className="flex flex-wrap gap-3 text-[11px] text-[#CBD5E1]">
            <div className="flex flex-col gap-1">
              <span>Comprimento</span>
              <div className="flex gap-2">
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

            <div className="flex items-center gap-2 mt-2">
              <input
                id="hashtag-auto"
                type="checkbox"
                checked={hashtagAuto}
                onChange={(e) => setHashtagAuto(e.target.checked)}
                className="h-3 w-3 rounded border-[#312356] bg-[#050017] text-[#7C3AED] focus:ring-0"
              />
              <label
                htmlFor="hashtag-auto"
                className="text-[11px] text-[#CBD5E1]"
              >
                Gerar hashtags automaticamente
              </label>
            </div>
          </div>

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
            • Em produção, aqui você vai chamar sua API/Cloud Function de IA e
            salvar o rascunho no Firestore já com os campos preenchidos.
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
            Assim o post deve aparecer antes de ser agendado ou publicado.
          </p>

          <div className="rounded-2xl border border-[#261341] bg-[#050017] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#C026D3]" />
              <div className="flex flex-col">
                <span className="text-[11px] text-white font-medium">
                  Agência Digital Exemplo
                </span>
                <span className="text-[10px] text-[#9CA3AF]">
                  {rede} • Pré-visualização
                </span>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <p className="text-[12px] text-white font-semibold">
                {tituloGerado || "O título gerado aparecerá aqui."}
              </p>
              <p className="text-[11px] text-[#CBD5E1]">
                {textoGerado ||
                  "Após gerar com IA, o texto completo da legenda será exibido aqui para revisão antes de agendar ou publicar."}
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
            • Próximo passo: ao salvar, criar documento em{" "}
            <span className="text-[#C4B5FD] font-mono">
              posts
            </span>{" "}
            no Firestore com status <strong>“Rascunho”</strong> e o conteúdo
            gerado.
          </p>
        </div>
      </div>
    </section>
  );
}
