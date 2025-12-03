// app/(app)/components/EngagementChart.tsx
"use client";

import { useState } from "react";

const CARD = "#0B001F";
const BORDER = "#261341";

const LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;
type NetworkKey = "consolidado" | "instagram" | "facebook" | "whatsapp";

const SERIES: Record<NetworkKey, number[]> = {
  // valores fictícios de índice de engajamento (0–100)
  consolidado: [38, 52, 47, 70, 63, 82, 55],
  instagram:   [45, 60, 58, 78, 72, 90, 65],
  facebook:    [28, 40, 35, 55, 48, 60, 43],
  whatsapp:    [32, 48, 40, 62, 57, 75, 50],
};

const LABEL_BY_KEY: Record<NetworkKey, string> = {
  consolidado: "Consolidado",
  instagram:   "Instagram",
  facebook:    "Facebook",
  whatsapp:    "WhatsApp",
};

export function EngagementChart() {
  const [selected, setSelected] = useState<NetworkKey>("consolidado");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const data = SERIES[selected];
  const max = Math.max(...data) || 1;

  const total = data.reduce((acc, v) => acc + v, 0);
  const avg = total / data.length;

  const currentLabel =
    hoverIndex !== null ? LABELS[hoverIndex] : "Média da semana";

  const currentValue =
    hoverIndex !== null ? data[hoverIndex] : Math.round(avg);

  let diffText = "Passe o mouse nos pontos para ver o detalhe do dia.";
  let diffColor = "#9CA3AF";

  if (hoverIndex !== null && hoverIndex > 0) {
    const prev = data[hoverIndex - 1];
    const curr = data[hoverIndex];
    const diff = curr - prev;
    const pct = prev > 0 ? (diff / prev) * 100 : 0;

    if (diff > 0) {
      diffText = `+${diff} pts vs dia anterior (${pct.toFixed(1)}%)`;
      diffColor = "#22C55E";
    } else if (diff < 0) {
      diffText = `${diff} pts vs dia anterior (${pct.toFixed(1)}%)`;
      diffColor = "#EF4444";
    } else {
      diffText = "Sem variação em relação ao dia anterior.";
      diffColor = "#9CA3AF";
    }
  }

  if (hoverIndex === 0) {
    diffText = "Primeiro dia da série. Sem comparação anterior.";
    diffColor = "#9CA3AF";
  }

  return (
    <div
      className="rounded-2xl p-4 md:p-5"
      style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
    >
      {/* Título + filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-white">
            Engajamento diário – {LABEL_BY_KEY[selected]}
          </h2>
          <span className="text-[11px] text-[#9CA3AF]">
            Índice de engajamento (0–100) ao longo da semana.
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          {(
            [
              "consolidado",
              "instagram",
              "facebook",
              "whatsapp",
            ] as NetworkKey[]
          ).map((key) => {
            const isActive = key === selected;
            const label =
              key === "consolidado" ? "Consolidado" : LABEL_BY_KEY[key];

            return (
              <button
                key={key}
                onClick={() => {
                  setSelected(key);
                  setHoverIndex(null);
                }}
                className={`px-3 py-1.5 rounded-full border text-xs transition ${
                  isActive
                    ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                    : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gráfico */}
      <div className="rounded-2xl bg-gradient-to-b from-[#1F1033] to-[#050012] border border-[#261341]/60 px-3 pt-3 pb-4">
        <svg
          viewBox="0 0 300 120"
          className="w-full h-28 md:h-32 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#C026D3" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
          </defs>

          {/* Linha */}
          <polyline
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={data
              .map(
                (v, i) =>
                  `${(i / (data.length - 1 || 1)) * 300},${
                    120 - (v / max) * 100
                  }`,
              )
              .join(" ")}
          />

          {/* Pontos clicáveis/hover */}
          {data.map((v, i) => {
            const cx = (i / (data.length - 1 || 1)) * 300;
            const cy = 120 - (v / max) * 100;
            const active = hoverIndex === i;

            return (
              <g key={i}>
                {/* anel */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={active ? 6 : 4.5}
                  fill="#050012"
                  stroke="#F9FAFB"
                  strokeWidth={active ? 2 : 1.5}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                  style={{ cursor: "pointer" }}
                />
              </g>
            );
          })}
        </svg>

        {/* Eixo X */}
        <div className="mt-2 flex justify-between text-[10px] text-[#9CA3AF] px-1">
          {LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>

      {/* Resumo numérico */}
      <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-1">
        <div className="text-[11px] text-[#CBD5E1]">
          <span className="text-[#9CA3AF] mr-1">Foco atual:</span>
          <span className="font-semibold text-white">{currentLabel}</span>
          <span className="mx-1">•</span>
          <span className="text-[#9CA3AF]">Índice:</span>{" "}
          <span className="font-semibold text-white">{currentValue}</span>
        </div>
        <div className="text-[11px]" style={{ color: diffColor }}>
          {diffText}
        </div>
      </div>
    </div>
  );
}
