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

const CARD = "#0B001F";
const BORDER = "#261341";

type Rede = "Instagram" | "Facebook" | "WhatsApp";

export default function CreatePostManualPage() {
  const router = useRouter();

  const [redesSelecionadas, setRedesSelecionadas] = useState<Rede[]>([
    "Instagram",
  ]);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [publicarAgora, setPublicarAgora] = useState(true);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");

  const [tipoMidia, setTipoMidia] = useState<"nenhuma" | "imagem" | "video">(
    "imagem",
  );
  const [midiaArquivoNome, setMidiaArquivoNome] = useState<string | null>(null);

  function toggleRede(rede: Rede) {
    setRedesSelecionadas((atual) =>
      atual.includes(rede)
        ? atual.filter((r) => r !== rede)
        : [...atual, rede],
    );
  }

  function handleVoltar() {
    router.push("/posts");
  }

  function handleSalvar(tipo: "rascunho" | "agendar" | "publicar") {
    if (redesSelecionadas.length === 0) {
      alert("Selecione pelo menos uma rede social.");
      return;
    }
    if (!conteudo.trim()) {
      alert("Digite o texto / legenda da postagem.");
      return;
    }

    console.log("Salvar post manual:", {
      redesSelecionadas,
      titulo,
      conteudo,
      data,
      hora,
      tipoMidia,
      midiaArquivoNome,
      tipo,
    });

    alert(
      `Simulação: salvar como ${tipo.toUpperCase()} para as redes: ${redesSelecionadas.join(
        ", ",
      )}.\n\nNa produção, isso vira um ou vários documentos no Firestore, ligados a cada rede selecionada, com a URL da mídia no Firebase Storage.`,
    );
  }

  function handleChangeMidia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setMidiaArquivoNome(file ? file.name : null);
    // Produção: upload para Firebase Storage
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
            {(["Instagram", "Facebook", "WhatsApp"] as Rede[]).map((rede) => {
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
            • Apenas para sua organização dentro do VIRALINK. Não aparece nas
            redes.
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
              onClick={() => setTipoMidia("nenhuma")}
              className={`px-3 py-1.5 rounded-full border transition ${
                tipoMidia === "nenhuma"
                  ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                  : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
              }`}
            >
              Sem mídia
            </button>
          </div>

          {tipoMidia !== "nenhuma" && (
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
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => handleSalvar("rascunho")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-[#312356] text-[#E5E7EB] hover:bg-white/5 transition"
          >
            <FiSave size={14} />
            Salvar como rascunho
          </button>
          <button
            type="button"
            onClick={() =>
              handleSalvar(publicarAgora ? "publicar" : "agendar")
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white shadow-lg"
            style={{
              background:
                "linear-gradient(90deg, #7C3AED 0%, #C026D3 50%, #0EA5E9 100%)",
            }}
          >
            {publicarAgora ? "Publicar agora" : "Agendar post"}
          </button>
        </div>

        <p className="text-[10px] text-[#6B7280]">
          • Em produção, você pode criar um documento por post e uma lista de
          redes, ou um documento por rede (ex.: um para Instagram, outro para
          Facebook), todos apontando para a mesma mídia no Firebase Storage.
        </p>
      </div>
    </section>
  );
}
