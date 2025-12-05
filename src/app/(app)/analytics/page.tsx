// src/app/(app)/analytics/page.tsx
"use client";

export default function AnalyticsPage() {
  // futuro: hook useAccountMetrics(workspaceId, dateRange)
  return (
    <section className="mt-4 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">
            Analytics
          </h1>
          <p className="text-xs text-[#9CA3AF]">
            Acompanhe o desempenho consolidado das suas redes conectadas.
          </p>
        </div>

        <div className="flex gap-2 text-[11px]">
          <button className="px-3 py-1.5 rounded-full border border-[#272046] text-[#E5E7EB] bg-[#111827]">
            Últimos 7 dias
          </button>
          <button className="px-3 py-1.5 rounded-full border border-[#272046] text-[#9CA3AF] hover:bg-[#111827]">
            Últimos 30 dias
          </button>
        </div>
      </header>

      {/* Cards KPI topo */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Seguidores</p>
          <p className="text-xl font-semibold text-white">18.240</p>
          <p className="text-[10px] text-emerald-400 mt-1">+4,2% vs. período anterior</p>
        </div>
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Cliques</p>
          <p className="text-xl font-semibold text-white">3.982</p>
          <p className="text-[10px] text-emerald-400 mt-1">+12,8%</p>
        </div>
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Engajamento médio</p>
          <p className="text-xl font-semibold text-white">6,4%</p>
          <p className="text-[10px] text-emerald-400 mt-1">+0,9 p.p.</p>
        </div>
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Posts publicados</p>
          <p className="text-xl font-semibold text-white">54</p>
          <p className="text-[10px] text-[#9CA3AF] mt-1">Inclui todas as redes</p>
        </div>
      </div>

      {/* Aqui entram os gráficos que já criamos: linha de engajamento, seguidores x cliques, comparativo redes etc. */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#E5E7EB] mb-2">
            Crescimento de seguidores (últimos 7 dias)
          </p>
          {/* componente de gráfico de linha */}
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#E5E7EB] mb-2">
            Seguidores x cliques
          </p>
          {/* gráfico comparativo */}
        </div>
      </div>
    </section>
  );
}
