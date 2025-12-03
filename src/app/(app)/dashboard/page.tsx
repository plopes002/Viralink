// app/(app)/dashboard/page.tsx
"use client";

import { motion } from "framer-motion";
import { EngagementChart } from "../components/EngagementChart";

const CARD = "#0B001F";
const BORDER = "#261341";

export default function DashboardPage() {
  return (
    <section className="mt-4 space-y-6">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Visão geral
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1">
            Acompanhe em tempo real o desempenho das suas redes, posts e automações.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <button className="px-3 py-1.5 rounded-full border border-[#312356] text-[#E5E7EB] hover:bg-white/5 transition">
            Últimos 7 dias
          </button>
          <button className="px-3 py-1.5 rounded-full border border-[#312356] text-[#9CA3AF] hover:bg-white/5 transition">
            Últimos 30 dias
          </button>
        </div>
      </header>

      {/* Cards principais */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard label="Interações hoje" value="3.482" diff="+18%" tone="up" />
        <StatCard label="Mensagens respondidas" value="94%" diff="+6%" tone="up" />
        <StatCard label="Posts agendados" value="27" diff="+9" tone="up" />
        <StatCard
          label="Concorrentes monitorados"
          value="3"
          diff="Dentro do esperado"
          tone="neutral"
        />
      </div>

      {/* Linha 1: gráfico de engajamento + próximos posts */}
      <div className="grid lg:grid-cols-[1.4fr,0.9fr] gap-4">
        <EngagementChart />

        <motion.div
          className="rounded-2xl p-4 md:p-5 space-y-3"
          style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Próximos posts agendados
            </h2>
            <button className="text-[11px] text-[#0EA5E9] hover:underline">
              Ver agenda completa
            </button>
          </div>

          <UpcomingPostItem
            rede="Instagram"
            horario="Hoje • 18:30"
            titulo="Campanha de lançamento do pacote premium"
          />
          <UpcomingPostItem
            rede="Facebook"
            horario="Amanhã • 10:00"
            titulo="Depoimento de cliente + bastidores"
          />
          <UpcomingPostItem
            rede="WhatsApp"
            horario="Amanhã • 15:45"
            titulo="Lembrete de agendamento e CTA para resposta"
          />
        </motion.div>
      </div>

      {/* Linha 2: Crescimento seguidores x cliques + Concorrentes */}
      <div className="grid lg:grid-cols-[1.4fr,0.9fr] gap-4">
        <FollowersClicksChart />
        <CompetitorsChart />
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  diff,
  tone,
}: {
  label: string;
  value: string;
  diff: string;
  tone: "up" | "down" | "neutral";
}) {
  const diffColor =
    tone === "up" ? "#22C55E" : tone === "down" ? "#EF4444" : "#9CA3AF";

  return (
    <motion.div
      className="rounded-2xl p-4 md:p-5"
      style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-[11px] text-[#9CA3AF] mb-1">{label}</p>
      <p className="text-xl md:text-2xl font-semibold text-white">{value}</p>
      <p className="text-[11px]" style={{ color: diffColor }}>
        {diff}
      </p>
    </motion.div>
  );
}

function UpcomingPostItem({
  rede,
  horario,
  titulo,
}: {
  rede: string;
  horario: string;
  titulo: string;
}) {
  return (
    <div className="rounded-xl px-3 py-2.5 bg-[#120426] border border-[#2B1743]/80">
      <p className="text-[11px] text-[#9CA3AF]">
        {rede} • <span className="text-[#CBD5E1]">{horario}</span>
      </p>
      <p className="text-xs text-white mt-1">{titulo}</p>
    </div>
  );
}

/* NOVO: gráfico de crescimento seguidores x cliques */
function FollowersClicksChart() {
  const followers = [1200, 1340, 1500, 1600, 1780, 1900, 2100];
  const clicks = [180, 210, 240, 230, 280, 320, 310];
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const maxFollowers = Math.max(...followers);
  const maxClicks = Math.max(...clicks);

  return (
    <motion.div
      className="rounded-2xl p-4 md:p-5"
      style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Crescimento de seguidores x cliques
          </h2>
          <p className="text-[11px] text-[#9CA3AF]">
            Comparativo entre novos seguidores e cliques em links.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#CBD5E1]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#7C3AED]" /> Seguidores
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#0EA5E9]" /> Cliques
          </span>
        </div>
      </div>

      <div className="h-40 rounded-2xl bg-gradient-to-b from-[#1F1033] to-[#050012] border border-[#261341]/60 px-3 pt-3 pb-4">
        <svg
          viewBox="0 0 300 120"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* linha seguidores */}
          <polyline
            fill="none"
            stroke="#7C3AED"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={followers
              .map(
                (v, i) =>
                  `${(i / (followers.length - 1 || 1)) * 300},${
                    120 - (v / maxFollowers) * 100
                  }`,
              )
              .join(" ")}
          />
          {/* pontos seguidores */}
          {followers.map((v, i) => (
            <circle
              key={`f-${i}`}
              cx={(i / (followers.length - 1 || 1)) * 300}
              cy={120 - (v / maxFollowers) * 100}
              r="3.5"
              fill="#7C3AED"
              stroke="#F9FAFB"
              strokeWidth="1"
            />
          ))}

          {/* linha cliques */}
          <polyline
            fill="none"
            stroke="#0EA5E9"
            strokeWidth="2.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={clicks
              .map(
                (v, i) =>
                  `${(i / (clicks.length - 1 || 1)) * 300},${
                    120 - (v / maxClicks) * 100
                  }`,
              )
              .join(" ")}
          />
          {/* pontos cliques */}
          {clicks.map((v, i) => (
            <circle
              key={`c-${i}`}
              cx={(i / (clicks.length - 1 || 1)) * 300}
              cy={120 - (v / maxClicks) * 100}
              r="3"
              fill="#050012"
              stroke="#0EA5E9"
              strokeWidth="1"
            />
          ))}
        </svg>

        <div className="mt-2 flex justify-between text-[10px] text-[#9CA3AF] px-1">
          {days.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-[#CBD5E1]">
        Em geral, o aumento de seguidores acompanha o volume de cliques,
        indicando boa qualidade dos conteúdos.
      </p>
    </motion.div>
  );
}

/* NOVO: gráfico de concorrentes */
function CompetitorsChart() {
  const competitors = [
    { name: "Você", score: 82, color: "#7C3AED" },
    { name: "Concorrente A", score: 74, color: "#C026D3" },
    { name: "Concorrente B", score: 69, color: "#0EA5E9" },
  ];

  const max = Math.max(...competitors.map((c) => c.score));

  return (
    <motion.div
      className="rounded-2xl p-4 md:p-5 space-y-3"
      style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Concorrentes – índice de engajamento
          </h2>
          <p className="text-[11px] text-[#9CA3AF]">
            Comparação do engajamento médio nas últimas semanas.
          </p>
        </div>
        <span className="text-[11px] text-[#22C55E]">
          Você está à frente 🔥
        </span>
      </div>

      <div className="space-y-2 mt-2">
        {competitors.map((c) => (
          <div key={c.name} className="text-[11px] text-[#CBD5E1]">
            <div className="flex items-center justify-between mb-1">
              <span className={c.name === "Você" ? "font-semibold text-white" : ""}>
                {c.name}
              </span>
              <span>{c.score} pts</span>
            </div>
            <div className="h-2 rounded-full bg-[#120426] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(c.score / max) * 100}%`,
                  background:
                    c.name === "Você"
                      ? "linear-gradient(90deg,#7C3AED,#0EA5E9)"
                      : c.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[11px] text-[#9CA3AF]">
        Use os relatórios detalhados para entender o que os concorrentes estão
        fazendo e onde você pode abrir ainda mais vantagem.
      </p>
    </motion.div>
  );
}