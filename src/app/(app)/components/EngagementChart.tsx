
"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const CARD = "#0B001F";
const BORDER = "#261341";

const LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;
type NetworkKey = "consolidado" | "instagram" | "facebook" | "whatsapp";

const SERIES: Record<NetworkKey, number[]> = {
  consolidado: [38, 52, 47, 70, 63, 82, 55],
  instagram:   [45, 60, 58, 78, 72, 90, 65],
  facebook:    [28, 40, 35, 55, 48, 60, 43],
  whatsapp:    [32, 48, 40, 62, 57, 75, 50],
};

const LABEL_BY_KEY: Record<NetworkKey, string> = {
  consolidado: "Engajamento consolidado",
  instagram:   "Instagram",
  facebook:    "Facebook",
  whatsapp:    "WhatsApp",
};

export function EngagementChart() {
  const [selected, setSelected] = useState<NetworkKey>("consolidado");
  const data = SERIES[selected];
  const max = Math.max(...data) || 1;

  return (
    <motion.div
      className="rounded-2xl p-4 md:p-5"
      style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Título + filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-white">
            {selected === "consolidado"
              ? "Engajamento consolidado"
              : `Engajamento – ${LABEL_BY_KEY[selected]}`}
          </h2>
          <span className="text-[11px] text-[#9CA3AF]">
            Taxa de engajamento diária nas últimas interações.
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
                onClick={() => setSelected(key)}
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
      <div className="h-40 rounded-2xl bg-gradient-to-b from-[#1F1033] to-[#050012] border border-[#261341]/60 px-3 pt-3 pb-4">
        <svg
          viewBox="0 0 300 120"
          className="w-full h-full overflow-visible"
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
          <motion.polyline
            key={selected}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={data
              .map(
                (v, i) =>
                  `${(i / (data.length - 1)) * 300},${120 - (v / max) * 100}`,
              )
              .join(" ")}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {/* Pontos */}
          {data.map((v, i) => (
            <motion.circle
              key={`${selected}-${i}`}
              cx={(i / (data.length - 1)) * 300}
              cy={120 - (v / max) * 100}
              r="4"
              fill="#050012"
              stroke="#F9FAFB"
              strokeWidth="1.5"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
            />
          ))}
        </svg>

        {/* Eixo X */}
        <div className="mt-2 flex justify-between text-[10px] text-[#9CA3AF] px-1">
          {LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
