// app/(app)/dashboard/page.tsx
"use client";

import { motion } from "framer-motion";
import { EngagementChart } from "../components/EngagementChart";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useEffect, useMemo, useRef, useState } from "react";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import LogoutButton from "@/components/LogoutButton";


const CARD = "#0B001F";
const BORDER = "#261341";

type InstagramInsights = {
  username?: string;
  followers_count?: number;
  media_count?: number;
};

type InstagramHistoryItem = {
  dateKey: string;
  followersCount: number;
  mediaCount: number;
};

function formatNetwork(network?: string) {
  if (!network) return "Rede";
  if (network === "instagram") return "Instagram";
  if (network === "facebook") return "Facebook";
  if (network === "whatsapp") return "WhatsApp";
  return network;
}

function formatScheduledDate(date?: any) {
  if (!date) return "Sem data";

  const scheduled = date.toDate ? date.toDate() : new Date(date);
  const now = new Date();

  const isToday =
    scheduled.getDate() === now.getDate() &&
    scheduled.getMonth() === now.getMonth() &&
    scheduled.getFullYear() === now.getFullYear();

  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  const isTomorrow =
    scheduled.getDate() === tomorrow.getDate() &&
    scheduled.getMonth() === tomorrow.getMonth() &&
    scheduled.getFullYear() === tomorrow.getFullYear();

  const time = scheduled.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return `Hoje • ${time}`;
  if (isTomorrow) return `Amanhã • ${time}`;

  return scheduled.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  

  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const {
    posts: scheduledPosts,
    loading: loadingScheduledPosts,
  } = useScheduledPosts(workspaceId);

  const [insights, setInsights] = useState<InstagramInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [history, setHistory] = useState<InstagramHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const lastLoadedWorkspaceIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setInsights(null);
      setLoadingInsights(false);
      setInsightsError("Workspace não disponível.");
      return;
    }

    if (lastLoadedWorkspaceIdRef.current === workspaceId) {
      return;
    }

    lastLoadedWorkspaceIdRef.current = workspaceId;

    const controller = new AbortController();

    async function load() {
      setLoadingInsights(true);
      setInsightsError(null);

      try {
        const res = await fetch(
          `/api/instagram/insights?workspaceId=${encodeURIComponent(workspaceId)}`,
          {
            method: "GET",
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const contentType = res.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");

        if (!res.ok) {
          if (isJson) {
            const errorJson = await res.json().catch(() => null);
            throw new Error(
              errorJson?.message ||
                errorJson?.error ||
                `Erro ao carregar insights (${res.status})`
            );
          }

          const errorText = await res.text().catch(() => "");
          throw new Error(
            errorText?.trim() || `Erro ao carregar insights (${res.status})`
          );
        }

        if (!isJson) {
          const raw = await res.text().catch(() => "");
          throw new Error(
            raw?.trim() || "A API retornou uma resposta inválida (não JSON)."
          );
        }

        const json = await res.json();

        if (!json?.ok) {
          throw new Error(json?.message || "A API retornou erro ao buscar insights.");
        }

        setInsights(json.data ?? null);
      } catch (err: any) {
        if (err?.name === "AbortError") return;

        console.error("Failed to load instagram insights", err);
        setInsights(null);
        setInsightsError(err?.message || "Erro inesperado ao carregar insights.");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingInsights(false);
        }
      }
    }

    load();

    return () => {
      controller.abort();
    };
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) {
      setHistory([]);
      setLoadingHistory(false);
      return;
    }
  
    const controller = new AbortController();
  
    async function loadHistory() {
      setLoadingHistory(true);
  
      try {
        const res = await fetch(
          `/api/instagram/history?workspaceId=${encodeURIComponent(workspaceId)}`,
          {
            method: "GET",
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );
  
        const json = await res.json();
  
        if (!json?.ok) {
          throw new Error(json?.message || "Erro ao carregar histórico.");
        }
  
        setHistory(json.data ?? []);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Failed to load instagram history", err);
        setHistory([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingHistory(false);
        }
      }
    }
  
    loadHistory();
  
    return () => controller.abort();
  }, [workspaceId]);

  const followersValue = useMemo(() => {
    if (loadingInsights) return "...";
    if (!insights?.followers_count && insights?.followers_count !== 0) return "N/A";
    return insights.followers_count.toLocaleString("pt-BR");
  }, [insights, loadingInsights]);

  const mediaCountValue = useMemo(() => {
    if (loadingInsights) return "...";
    if (!insights?.media_count && insights?.media_count !== 0) return "N/A";
    return String(insights.media_count);
  }, [insights, loadingInsights]);

  const usernameValue = useMemo(() => {
    if (loadingInsights) return "Carregando...";
    return insights?.username || "Conta não encontrada";
  }, [insights, loadingInsights]);

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

      {insightsError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {insightsError}
        </div>
      )}

      {/* Cards principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Seguidores"
          value={followersValue}
          diff={usernameValue}
          tone="neutral"
        />
        <StatCard
          label="Publicações"
          value={mediaCountValue}
          diff="total"
          tone="neutral"
        />
        <StatCard label="Mensagens respondidas" value="94%" diff="+6%" tone="up" />
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

          {loadingScheduledPosts ? (
            <p className="text-[11px] text-[#9CA3AF]">Carregando posts agendados...</p>
          ) : !scheduledPosts || scheduledPosts.length === 0 ? (
            <p className="text-[11px] text-[#9CA3AF]">
              Nenhum post agendado encontrado.
            </p>
          ) : (
            scheduledPosts.map((post) => (
              <UpcomingPostItem
                key={post.id}
                rede={formatNetwork(post.networks?.[0])}
                horario={formatScheduledDate(post.runAt)}
                titulo={post.title || post.content?.text || "Post agendado"}
              />
            ))
          )}
        </motion.div>
      </div>

      {/* Linha 2: Crescimento seguidores x cliques + Concorrentes */}
      <div className="grid lg:grid-cols-[1.4fr,0.9fr] gap-4">
        <FollowersHistoryChart history={history} loading={loadingHistory} />
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

function FollowersHistoryChart({
  history,
  loading,
}: {
  history: { dateKey: string; followersCount: number }[];
  loading: boolean;
}) {
  const days =
    history.length > 0
      ? history.map((item) => {
          const [, month, day] = item.dateKey.split("-");
          return `${day}/${month}`;
        })
      : ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const followers =
    history.length > 0 ? history.map((item) => item.followersCount) : [0, 0, 0, 0, 0, 0, 0];

  const maxFollowers = Math.max(...followers, 1);

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
            Crescimento de seguidores
          </h2>
          <p className="text-[11px] text-[#9CA3AF]">
            Histórico real de seguidores capturado pelo sistema.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#CBD5E1]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#7C3AED]" /> Seguidores
          </span>
        </div>
      </div>

      <div className="h-40 rounded-2xl bg-gradient-to-b from-[#1F1033] to-[#050012] border border-[#261341]/60 px-3 pt-3 pb-4">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-[#9CA3AF]">
            Carregando histórico...
          </div>
        ) : history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#9CA3AF]">
            Ainda não há histórico suficiente. Abra o dashboard nos próximos dias
            para formar a curva real.
          </div>
        ) : (
          <>
            <svg
              viewBox="0 0 300 120"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
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
                      }`
                  )
                  .join(" ")}
              />
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
            </svg>

            <div className="mt-2 flex justify-between text-[10px] text-[#9CA3AF] px-1">
              {days.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="mt-2 text-[11px] text-[#CBD5E1]">
        O gráfico passa a refletir dados reais conforme o sistema vai capturando
        snapshots do Instagram.
      </p>
    </motion.div>
  );
}


/* gráfico de concorrentes */
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

