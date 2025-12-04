// app/(app)/concorrentes/components/CompetitorVsBrandSection.tsx
"use client";

import type { DayPoint } from "@/hooks/useCompetitorMetrics";

interface CompetitorVsBrandSectionProps {
  brandName: string;
  brandFollowers7d: DayPoint[];
  brandEngagement7d: DayPoint[];

  competitorName: string;
  competitorFollowers7d: DayPoint[];
  competitorEngagement7d: DayPoint[];
}

function sum(values: DayPoint[]) {
  return values.reduce((acc, v) => acc + v.value, 0);
}

function avg(values: DayPoint[]) {
  if (!values.length) return 0;
  return values.reduce((acc, v) => acc + v.value, 0) / values.length;
}

function formatPercent(n: number) {
  return `${n.toFixed(1)}%`;
}

export function CompetitorVsBrandSection({
  brandName,
  brandFollowers7d,
  brandEngagement7d,
  competitorName,
  competitorFollowers7d,
  competitorEngagement7d,
}: CompetitorVsBrandSectionProps) {
  const brandFollowersTotal = sum(brandFollowers7d);
  const competitorFollowersTotal = sum(competitorFollowers7d);

  const brandEngagementAvg = avg(brandEngagement7d);
  const competitorEngagementAvg = avg(competitorEngagement7d);

  // alinhando labels (assumindo mesma sequência de dias)
  const labels =
    brandFollowers7d.length > 0
      ? brandFollowers7d.map((d) => d.label)
      : competitorFollowers7d.map((d) => d.label);

  return (
    <div className="mt-4 rounded-2xl border border-[#261341] bg-[#050017] p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-white">
            Minha marca x Concorrente
          </p>
          <p className="text-[10px] text-[#9CA3AF]">
            Compare crescimento e engajamento da sua conta com o concorrente
            selecionado nos últimos 7 dias.
          </p>
        </div>
      </div>

      {/* cards resumo lado a lado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#1F1134] bg-[#050017] px-3 py-3">
          <p className="text-[10px] text-[#9CA3AF] mb-1">Minha marca</p>
          <p className="text-sm font-semibold text-white truncate">
            {brandName}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <div>
              <p className="text-[#9CA3AF]">Novos seguidores (7d)</p>
              <p className="text-[13px] font-semibold text-emerald-300">
                +{brandFollowersTotal}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#9CA3AF]">Engajamento médio (7d)</p>
              <p className="text-[13px] font-semibold text-emerald-300">
                {formatPercent(brandEngagementAvg)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1F1134] bg-[#050017] px-3 py-3">
          <p className="text-[10px] text-[#9CA3AF] mb-1">Concorrente</p>
          <p className="text-sm font-semibold text-white truncate">
            {competitorName}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <div>
              <p className="text-[#9CA3AF]">Novos seguidores (7d)</p>
              <p className="text-[13px] font-semibold text-fuchsia-300">
                +{competitorFollowersTotal}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#9CA3AF]">Engajamento médio (7d)</p>
              <p className="text-[13px] font-semibold text-fuchsia-300">
                {formatPercent(competitorEngagementAvg)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* gráfico comparativo de crescimento */}
      <div className="mt-2 rounded-2xl border border-[#1F1134] bg-gradient-to-b from-[#130126] to-[#020016] px-4 py-3">
        <p className="text-[11px] text-[#E5E7EB] mb-1">
          Crescimento de seguidores (7 dias)
        </p>
        <p className="text-[10px] text-[#9CA3AF] mb-2">
          Linhas sobrepostas para comparar a curva de crescimento.
        </p>

        <div className="relative h-32 mt-1">
          <div className="absolute inset-0 rounded-2xl bg-[#050017]/60" />

          <div className="absolute inset-[10px] flex items-end justify-between px-1">
            {labels.map((label, idx) => {
              const myValue = brandFollowers7d[idx]?.value ?? 0;
              const compValue = competitorFollowers7d[idx]?.value ?? 0;
              const max =
                Math.max(
                  ...brandFollowers7d.map((d) => d.value || 1),
                  ...competitorFollowers7d.map((d) => d.value || 1),
                ) || 1;

              const myHeight = (myValue / max) * 70 + 5;
              const compHeight = (compValue / max) * 70 + 5;

              return (
                <div
                  key={label}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="relative h-[80px] w-full">
                    {/* ponto da minha marca */}
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-emerald-400"
                      style={{ height: `${myHeight}px` }}
                    />
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[8px] w-[8px] rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                      style={{ transform: `translateY(-${myHeight}px)` }}
                    />

                    {/* ponto do concorrente */}
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-fuchsia-400"
                      style={{ height: `${compHeight}px`, opacity: 0.7 }}
                    />
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[8px] w-[8px] rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(244,114,182,0.7)]"
                      style={{ transform: `translateY(-${compHeight}px)` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#9CA3AF]">{label}</span>
                </div>
              );
            })}
          </div>

          {/* legenda */}
          <div className="absolute bottom-2 right-3 flex items-center gap-3 text-[9px] text-[#9CA3AF]">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Minha marca</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
              <span>Concorrente</span>
            </div>
          </div>
        </div>
      </div>

      {/* gráfico comparativo de engajamento */}
      <div className="mt-2 rounded-2xl border border-[#1F1134] bg-[#050017] px-4 py-3">
        <p className="text-[11px] text-[#E5E7EB] mb-1">
          Engajamento diário comparado (7 dias)
        </p>
        <p className="text-[10px] text-[#9CA3AF] mb-2">
          Veja em quais dias o concorrente performa melhor do que você.
        </p>

        <div className="relative h-28 mt-1">
          <div className="absolute inset-0 rounded-2xl bg-[#020016]" />
          <div className="absolute inset-[8px] flex items-end justify-between gap-1">
            {labels.map((label, idx) => {
              const myValue = brandEngagement7d[idx]?.value ?? 0;
              const compValue = competitorEngagement7d[idx]?.value ?? 0;
              const max =
                Math.max(
                  ...brandEngagement7d.map((d) => d.value || 1),
                  ...competitorEngagement7d.map((d) => d.value || 1),
                ) || 1;

              const myHeight = (myValue / max) * 60;
              const compHeight = (compValue / max) * 60;

              return (
                <div
                  key={label}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="flex items-end gap-[3px] h-[60px]">
                    <div
                      className="w-[6px] rounded-full bg-emerald-400/90"
                      style={{ height: `${myHeight}px` }}
                    />
                    <div
                      className="w-[6px] rounded-full bg-fuchsia-400/90"
                      style={{ height: `${compHeight}px` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#9CA3AF]">{label}</span>
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-2 right-3 flex items-center gap-3 text-[9px] text-[#9CA3AF]">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Minha marca</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
              <span>Concorrente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}