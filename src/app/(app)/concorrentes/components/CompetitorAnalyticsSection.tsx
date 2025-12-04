// app/(app)/concorrentes/components/CompetitorAnalyticsSection.tsx
"use client";

interface DayPoint {
  label: string;
  value: number;
}

interface CompetitorAnalyticsSectionProps {
  followers7d: DayPoint[];      // crescimento de seguidores por dia
  clicks7d: DayPoint[];         // cliques em links/CTA por dia
  engagement7d: DayPoint[];     // engajamento (%) por dia
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".", ",") + "k";
  return n.toString();
}

function formatPercent(n: number) {
  return `${n.toFixed(1)}%`;
}

export function CompetitorAnalyticsSection({
  followers7d,
  clicks7d,
  engagement7d,
}: CompetitorAnalyticsSectionProps) {
  const totalFollowersGain = followers7d.reduce((sum, d) => sum + d.value, 0);
  const totalClicks = clicks7d.reduce((sum, d) => sum + d.value, 0);
  const avgEngagement =
    engagement7d.length > 0
      ? engagement7d.reduce((sum, d) => sum + d.value, 0) / engagement7d.length
      : 0;

  return (
    <div className="space-y-3 mt-3">
      {/* 1) Crescimento de seguidores */}
      <div className="rounded-2xl border border-[#1F1134] bg-gradient-to-b from-[#19052D] via-[#100021] to-[#050017] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[11px] text-[#E5E7EB] font-medium">
              Crescimento de seguidores (últimos 7 dias)
            </p>
            <p className="text-[10px] text-[#9CA3AF]">
              Evolução diária de novos seguidores.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#9CA3AF]">Total no período</p>
            <p className="text-sm font-semibold text-white">
              +{formatNumber(totalFollowersGain)}
            </p>
          </div>
        </div>

        {/* gráfico de linha “fake” mas informativo */}
        <div className="relative h-32 mt-1">
          <div className="absolute inset-0 rounded-2xl bg-[#050017]/60" />
          <div
            className="absolute inset-[6px] rounded-2xl"
            style={{
              background:
                "linear-gradient(90deg,#7C3AED33 0%,#EC489933 50%,#0EA5E933 100%)",
            }}
          />
          {/* linha */}
          <div className="absolute inset-[10px] flex items-end justify-between px-1">
            {followers7d.map((d, idx) => {
              const max = Math.max(...followers7d.map((p) => p.value || 1));
              const height = max > 0 ? (d.value / max) * 70 + 10 : 10;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-1 flex-1"
                >
                  <div
                    className="relative w-full flex justify-center"
                    style={{ height: "80px" }}
                  >
                    <div
                      className="absolute bottom-0 w-[8px] md:w-[10px] rounded-full bg-gradient-to-b from-[#7C3AED] via-[#EC4899] to-[#0EA5E9] shadow-[0_0_12px_rgba(236,72,153,0.6)]"
                      style={{ height: `${height}px` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#9CA3AF]">{d.label}</span>
                  <span className="text-[9px] text-[#E5E7EB]">
                    +{d.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2) Seguidores x Cliques */}
      <div className="rounded-2xl border border-[#1F1134] bg-[#050017] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[11px] text-[#E5E7EB] font-medium">
              Seguidores x Cliques (últimos 7 dias)
            </p>
            <p className="text-[10px] text-[#9CA3AF]">
              Relação entre crescimento da base e cliques em links/CTA.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#9CA3AF]">Cliques no período</p>
            <p className="text-sm font-semibold text-white">
              {formatNumber(totalClicks)}
            </p>
          </div>
        </div>

        <div className="relative h-32 mt-1">
          <div className="absolute inset-0 rounded-2xl bg-[#050017]" />
          <div className="absolute inset-[8px] flex items-end justify-between gap-1">
            {followers7d.map((day, idx) => {
              const clicks = clicks7d[idx]?.value ?? 0;
              const max = Math.max(
                ...followers7d.map((p) => p.value || 1),
                ...clicks7d.map((p) => p.value || 1),
              );
              const followersHeight = (day.value / max) * 60;
              const clicksHeight = (clicks / max) * 60;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="flex items-end gap-[2px] h-[70px]">
                    {/* barra seguidores */}
                    <div
                      className="w-[7px] rounded-full bg-[#7C3AED]"
                      style={{ height: `${followersHeight}px` }}
                    />
                    {/* barra cliques */}
                    <div
                      className="w-[7px] rounded-full bg-[#0EA5E9]"
                      style={{ height: `${clicksHeight}px` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#9CA3AF]">{day.label}</span>
                </div>
              );
            })}
          </div>
          {/* legenda */}
          <div className="absolute bottom-1 right-2 flex items-center gap-3 text-[9px] text-[#9CA3AF]">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
              <span>Seguidores</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#0EA5E9]" />
              <span>Cliques</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3) Engajamento diário */}
      <div className="rounded-2xl border border-[#1F1134] bg-[#050017] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[11px] text-[#E5E7EB] font-medium">
              Engajamento diário (últimos 7 dias)
            </p>
            <p className="text-[10px] text-[#9CA3AF]">
              Taxa de engajamento estimada por dia (%).
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#9CA3AF]">Média do período</p>
            <p className="text-sm font-semibold text-white">
              {formatPercent(avgEngagement)}
            </p>
          </div>
        </div>

        <div className="relative h-32 mt-1">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#020016] to-[#130126]" />
          {/* linha de engajamento */}
          <div className="absolute inset-[10px] flex items-end justify-between px-1">
            {engagement7d.map((d, idx) => {
              const max = Math.max(...engagement7d.map((p) => p.value || 1));
              const height = (d.value / max) * 70 + 10;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-1 flex-1"
                >
                  <div className="relative h-[80px] w-full flex items-end justify-center">
                    <div
                      className="absolute bottom-0 w-[2px] bg-gradient-to-t from-[#EC4899] via-[#8B5CF6] to-[#22D3EE]"
                      style={{ height: `${height}px` }}
                    />
                    <div
                      className="absolute -top-1 h-[10px] w-[10px] rounded-full border border-white/80 bg-[#EC4899] shadow-[0_0_12px_rgba(236,72,153,0.7)]"
                      style={{ transform: "translateY(4px)" }}
                    />
                  </div>
                  <span className="text-[9px] text-[#9CA3AF]">{d.label}</span>
                  <span className="text-[9px] text-[#E5E7EB]">
                    {d.value.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
