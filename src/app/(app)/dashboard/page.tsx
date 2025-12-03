// app/(app)/dashboard/page.tsx
"use client";

import { motion } from "framer-motion";
import { EngagementChart } from "../components/EngagementChart";

const CARD = "#0B001F";
const BORDER = "#261341";

export default function DashboardPage() {
  return (
    <section className="mt-4 space-y-6">
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
        <StatCard label="Concorrentes monitorados" value="3" diff="ok" tone="neutral" />
      </div>

      {/* Linhas com gráfico fake + próximos posts */}
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
    tone === "up"
      ? "#22C55E"
      : tone === "down"
      ? "#EF4444"
      : "#9CA3AF";

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
        {diff === "ok" ? "Dentro do esperado" : diff}
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
