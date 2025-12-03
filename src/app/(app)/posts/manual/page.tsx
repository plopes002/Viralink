// app/(app)/posts/manual/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiArrowLeft, FiCalendar, FiClock, FiSave } from "react-icons/fi";

const CARD = "#0B001F";
const BORDER = "#261341";

export default function CreatePostManualPage() {
  const router = useRouter();

  const [rede, setRede] = useState<"Instagram" | "Facebook" | "WhatsApp">(
    "Instagram",
  );
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [publicarAgora, setPublicarAgora] = useState(true);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");

  function handleVoltar() {
    router.push("/posts");
  }

  function handleSalvar(tipo: "rascunho" | "agendar" | "publicar") {
    // 🔥 aqui você vai mandar pro Firestore
    console.log("Salvar post manual:", { rede, titulo, conteudo, data, hora, tipo });
    alert(
      `Simulação: salvar como ${tipo.toUpperCase()}.\n\nNa produção isso vira um documento no Firestore com status adequado.`,
    );
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
            Crie um post do zero, escolha a rede, escreva a legenda e defina se
            quer publicar agora ou agendar para uma data específica.
          </p>
        </div>
      </header>

      {/* Form */}
      <div
        className="rounded-2xl p-4 md:p-5 space-y-4"
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      >
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#CBD5E1]">Rede social</label>
          <select
            value={rede}
            onChange={(e) => setRede(e.target.value as typeof rede)}
            className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          >
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="WhatsApp">WhatsApp</option>
          </select>
        </div>

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
            • Esse título é apenas para organização interna dentro do VIRALINK.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#CBD5E1]">
            Texto / legenda da postagem *
          </label>
          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={6}
            placeholder="Escreva aqui a legenda completa que será publicada na rede escolhida."
            className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          />
        </div>

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
          • Em produção, esse formulário cria/atualiza um documento na coleção{" "}
          <span className="text-[#C4B5FD] font-mono">posts</span> do Firestore,
          com os campos de horário de agendamento, status e dados da rede
          selecionada.
        </p>
      </div>
    </section>
  );
}
