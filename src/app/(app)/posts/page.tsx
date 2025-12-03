
// app/(app)/posts/page.tsx
"use client";

import { useState } from "react";
import { FiEdit3, FiPlus, FiZap, FiCalendar, FiInstagram, FiFacebook, FiMessageCircle } from "react-icons/fi";

const CARD = "#0B001F";
const BORDER = "#261341";

type Status = "Publicado" | "Agendado" | "Rascunho";

type PostRow = {
  id: string;
  titulo: string;
  rede: "Instagram" | "Facebook" | "WhatsApp";
  status: Status;
  data: string;
  hora: string;
  engajamento: string; // ex: "Alta", "Média", "Baixa"
};

const MOCK_POSTS: PostRow[] = [
  {
    id: "1",
    titulo: "Campanha: lançamento do plano Expert",
    rede: "Instagram",
    status: "Agendado",
    data: "Hoje",
    hora: "18:30",
    engajamento: "Previsto: Alto",
  },
  {
    id: "2",
    titulo: "Depoimento de cliente + bastidores",
    rede: "Facebook",
    status: "Agendado",
    data: "Amanhã",
    hora: "10:00",
    engajamento: "Previsto: Médio",
  },
  {
    id: "3",
    titulo: "Lembrete de agendamento e CTA para resposta",
    rede: "WhatsApp",
    status: "Agendado",
    data: "Amanhã",
    hora: "15:45",
    engajamento: "Previsto: Alto",
  },
  {
    id: "4",
    titulo: "Resultado da campanha de fim de semana",
    rede: "Instagram",
    status: "Publicado",
    data: "Ontem",
    hora: "21:10",
    engajamento: "Engajamento: 8.2k",
  },
  {
    id: "5",
    titulo: "Checklist de preparação para live",
    rede: "Instagram",
    status: "Rascunho",
    data: "-",
    hora: "-",
    engajamento: "Ainda não publicado",
  },
  {
    id: "6",
    titulo: "Oferta relâmpago de 24h",
    rede: "Facebook",
    status: "Publicado",
    data: "12/03",
    hora: "14:00",
    engajamento: "Engajamento: 3.4k",
  },
];

export default function PostsPage() {
  const [statusFilter, setStatusFilter] = useState<Status | "Todos">("Todos");
  const [redeFilter, setRedeFilter] = useState<"Todas" | "Instagram" | "Facebook" | "WhatsApp">("Todas");

  const filtered = MOCK_POSTS.filter((post) => {
    const statusOk = statusFilter === "Todos" ? true : post.status === statusFilter;
    const redeOk = redeFilter === "Todas" ? true : post.rede === redeFilter;
    return statusOk && redeOk;
  });

  const handleCreateWithAI = () => {
    // aqui futuramente abre modal / navega pra criar post com IA
    console.log("Criar post com IA");
    alert("Futuramente: abrir fluxo de criação de post com IA ✨");
  };

  const handleCreateManual = () => {
    console.log("Criar post manual");
    alert("Futuramente: abrir editor de post manual.");
  };

  return (
    <section className="mt-4 space-y-6">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Posts & Agenda
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 max-w-xl">
            Gerencie seus posts, veja o que está agendado e crie novos conteúdos com IA em poucos cliques.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={handleCreateWithAI}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold text-white shadow-lg"
            style={{
              background:
                "linear-gradient(90deg, #7C3AED 0%, #C026D3 50%, #0EA5E9 100%)",
            }}
          >
            <FiZap size={14} />
            Criar post com IA
          </button>
          <button
            onClick={handleCreateManual}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold border border-[#312356] text-[#E5E7EB] hover:bg-white/5 transition"
          >
            <FiPlus size={14} />
            Novo post manual
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="rounded-2xl p-3 md:p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between"
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      >
        <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
          {(["Todos", "Publicado", "Agendado", "Rascunho"] as const).map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full border transition ${
                  isActive
                    ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                    : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] md:text-xs">
          <span className="text-[#9CA3AF]">Filtrar por rede:</span>
          <select
            value={redeFilter}
            onChange={(e) =>
              setRedeFilter(e.target.value as typeof redeFilter)
            }
            className="bg-[#050017] border border-[#312356] text-[#E5E7EB] text-[11px] md:text-xs rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          >
            <option value="Todas">Todas</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="WhatsApp">WhatsApp</option>
          </select>
        </div>
      </div>

      {/* Lista / tabela de posts */}
      <div
        className="rounded-2xl p-3 md:p-4"
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      >
        <div className="hidden md:grid grid-cols-[2.2fr,1fr,1.1fr,1.2fr,1.1fr] px-3 pb-2 text-[11px] text-[#9CA3AF]">
          <span>Título</span>
          <span>Rede</span>
          <span>Status</span>
          <span>Data / Horário</span>
          <span>Engajamento</span>
        </div>

        <div className="divide-y divide-[#261341]/60">
          {filtered.length === 0 && (
            <div className="py-6 text-center text-[12px] text-[#9CA3AF]">
              Nenhum post encontrado com os filtros atuais.
            </div>
          )}

          {filtered.map((post) => (
            <PostRowItem key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PostRowItem({ post }: { post: PostRow }) {
  const statusColor =
    post.status === "Publicado"
      ? "#22C55E"
      : post.status === "Agendado"
      ? "#0EA5E9"
      : "#FACC15";

  const StatusBadge = (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium"
      style={{
        backgroundColor: "rgba(15,23,42,0.8)",
        border: "1px solid rgba(148,163,184,0.3)",
        color: statusColor,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: statusColor }}
      />
      {post.status}
    </span>
  );

  const redeIcon =
    post.rede === "Instagram" ? (
      <FiInstagram size={13} />
    ) : post.rede === "Facebook" ? (
      <FiFacebook size={13} />
    ) : (
      <FiMessageCircle size={13} />
    );

  // Layout desktop (grid) + mobile (cards)
  return (
    <div className="py-3 md:py-2">
      {/* DESKTOP */}
      <div className="hidden md:grid grid-cols-[2.2fr,1fr,1.1fr,1.2fr,1.1fr] items-center px-3 text-xs text-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <button className="h-7 w-7 flex items-center justify-center rounded-full bg-[#120426] border border-[#2B1743] text-[#C4B5FD]">
            <FiEdit3 size={13} />
          </button>
          <span className="truncate">{post.titulo}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#CBD5E1]">
          {redeIcon}
          <span>{post.rede}</span>
        </div>
        <div>{StatusBadge}</div>
        <div className="text-[11px] text-[#CBD5E1]">
          {post.data} {post.hora !== "-" && `• ${post.hora}`}
        </div>
        <div className="text-[11px] text-[#CBD5E1]">{post.engajamento}</div>
      </div>

      {/* MOBILE */}
      <div className="md:hidden rounded-xl border border-[#261341] bg-[#050017] px-3 py-2.5 text-[11px] text-[#E5E7EB]">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <button className="h-6 w-6 flex items-center justify-center rounded-full bg-[#120426] border border-[#2B1743] text-[#C4B5FD]">
              <FiEdit3 size={12} />
            </button>
            <p className="font-medium leading-snug">{post.titulo}</p>
          </div>
          {StatusBadge}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[#9CA3AF]">
          <span className="inline-flex items-center gap-1">
            {redeIcon}
            <span>{post.rede}</span>
          </span>
          <span>•</span>
          <span>
            {post.data}
            {post.hora !== "-" && ` • ${post.hora}`}
          </span>
        </div>

        <p className="mt-1 text-[#CBD5E1]">{post.engajamento}</p>
      </div>
    </div>
  );
}
