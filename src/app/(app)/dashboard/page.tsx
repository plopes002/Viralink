// app/(app)/dashboard/page.tsx
"use client";

import { motion } from "framer-motion";
import { EngagementChart } from "../components/EngagementChart";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useEffect, useMemo, useRef, useState } from "react";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";

const CARD = "#0B001F";
const BORDER = "#261341";

type SocialNetworkFilter = "all" | "instagram" | "facebook";

type SocialAccountItem = {
  id: string;
  network: "instagram" | "facebook";
  name?: string;
  username?: string;
  isPrimary?: boolean;
  status?: string;
  accountType?: "profile" | "page";
};

type DashboardInsights = {
  username?: string;
  followers_count?: number;
  media_count?: number;
  replied_rate?: number;
  replied_count?: number;
  interactions_count?: number;
  competitors_count?: number;
};

type HistoryItem = {
  dateKey: string;
  followersCount: number;
  mediaCount?: number;
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

function getAccountDisplayName(account?: SocialAccountItem | null) {
  if (!account) return "Conta";
  if (account.username) {
    return account.username.startsWith("@")
      ? account.username
      : `@${account.username}`;
  }
  return account.name || "Conta";
}

export default function DashboardPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const {
    posts: scheduledPosts,
    loading: loadingScheduledPosts,
  } = useScheduledPosts({ workspaceId });

  const { accounts, loading: loadingAccounts } = useSocialAccounts(workspaceId);

  const [selectedRange, setSelectedRange] = useState<7 | 30>(7);
  const [selectedNetwork, setSelectedNetwork] =
    useState<SocialNetworkFilter>("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");

  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const lastLoadedKeyRef = useRef<string | null>(null);

  const connectedAccounts = useMemo(() => {
    return (accounts || []).filter((acc: any) => acc.status === "connected");
  }, [accounts]);

  const networkAccounts = useMemo(() => {
    if (selectedNetwork === "all") return connectedAccounts;
    return connectedAccounts.filter(
      (acc: any) => acc.network === selectedNetwork
    );
  }, [connectedAccounts, selectedNetwork]);

  useEffect(() => {
    if (selectedAccountId === "all") return;

    const existsInCurrentFilter = networkAccounts.some(
      (acc: any) => acc.id === selectedAccountId
    );

    if (!existsInCurrentFilter) {
      setSelectedAccountId("all");
    }
  }, [networkAccounts, selectedAccountId]);

  const selectedAccount = useMemo(() => {
    if (selectedAccountId === "all") return null;
    return (
      connectedAccounts.find((acc: any) => acc.id === selectedAccountId) || null
    );
  }, [connectedAccounts, selectedAccountId]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    if (workspaceId) {
      params.set("workspaceId", workspaceId);
    }

    params.set("days", String(selectedRange));

    if (selectedNetwork !== "all") {
      params.set("network", selectedNetwork);
    }

    if (selectedAccountId !== "all") {
      params.set("socialAccountId", selectedAccountId);
    }

    return params;
  }, [workspaceId, selectedRange, selectedNetwork, selectedAccountId]);

  useEffect(() => {
    if (!workspaceId) {
      setInsights(null);
      setLoadingInsights(false);
      setInsightsError("Workspace não disponível.");
      return;
    }

    const loadKey = `${workspaceId}:${selectedRange}:${selectedNetwork}:${selectedAccountId}`;

    if (lastLoadedKeyRef.current === loadKey) {
      return;
    }

    lastLoadedKeyRef.current = loadKey;

    const controller = new AbortController();

    async function loadInsights() {
      setLoadingInsights(true);
      setInsightsError(null);

      try {
        const res = await fetch(
          `/api/dashboard/insights?${queryParams.toString()}`,
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
          throw new Error(
            json?.message || "A API retornou erro ao buscar insights."
          );
        }

        setInsights(json.data ?? null);
      } catch (err: any) {
        if (err?.name === "AbortError") return;

        console.error("Failed to load dashboard insights", err);
        setInsights(null);
        setInsightsError(err?.message || "Erro inesperado ao carregar insights.");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingInsights(false);
        }
      }
    }

    loadInsights();

    return () => {
      controller.abort();
    };
  }, [workspaceId, queryParams, selectedRange, selectedNetwork, selectedAccountId]);

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
          `/api/dashboard/history?${queryParams.toString()}`,
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
        console.error("Failed to load dashboard history", err);
        setHistory([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => controller.abort();
  }, [workspaceId, queryParams]);

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

  const repliedRateValue = useMemo(() => {
    if (loadingInsights) return "...";
    if (!insights?.replied_rate && insights?.replied_rate !== 0) return "N/A";
    return `${insights.replied_rate}%`;
  }, [insights, loadingInsights]);

  const repliedRateDiff = useMemo(() => {
    if (loadingInsights) return "Carregando...";

    const repliedCount = (insights as any)?.replied_count ?? 0;
    const interactionsCount = (insights as any)?.interactions_count ?? 0;

    return `${repliedCount}/${interactionsCount} respondidas`;
  }, [insights, loadingInsights]);

  const repliedRateTone = useMemo(() => {
    const rate = (insights as any)?.replied_rate ?? 0;
    if (rate >= 70) return "up" as const;
    if (rate > 0) return "neutral" as const;
    return "down" as const;
  }, [insights]);

  const competitorsCountValue = useMemo(() => {
    if (loadingInsights) return "...";
    if (!insights?.competitors_count && insights?.competitors_count !== 0) {
      return "0";
    }
    return String(insights.competitors_count);
  }, [insights, loadingInsights]);

  const competitorsStatusLabel = useMemo(() => {
    if (loadingInsights) return "Carregando...";
    const count = insights?.competitors_count ?? 0;
    if (count === 0) return "Nenhum concorrente cadastrado";
    if (count === 1) return "1 concorrente monitorado";
    return `${count} concorrentes ativos`;
  }, [insights, loadingInsights]);

  const sourceLabel = useMemo(() => {
    if (loadingInsights || loadingAccounts) return "Carregando...";
    if (selectedAccount) return getAccountDisplayName(selectedAccount);
    if (selectedNetwork === "all") return "Todas as contas";
    return `Todas as contas de ${formatNetwork(selectedNetwork)}`;
  }, [loadingInsights, loadingAccounts, selectedAccount, selectedNetwork]);

  return (
    <section className="mt-4 space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">
              Visão geral
            </h1>
            <p className="text-xs md:text-sm text-[#9CA3AF] mt-1">
              Acompanhe em tempo real o desempenho das suas redes, posts e automações.
            </p>
          </div>

          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setSelectedRange(7)}
              className={`px-3 py-1.5 rounded-full border transition ${
                selectedRange === 7
                  ? "border-[#4C1D95] bg-[#1D0B3A] text-white"
                  : "border-[#312356] text-[#9CA3AF] hover:bg-white/5"
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              onClick={() => setSelectedRange(30)}
              className={`px-3 py-1.5 rounded-full border transition ${
                selectedRange === 30
                  ? "border-[#4C1D95] bg-[#1D0B3A] text-white"
                  : "border-[#312356] text-[#9CA3AF] hover:bg-white/5"
              }`}
            >
              Últimos 30 dias
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#261341] bg-[#0B001F] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-white">Filtro de visualização</p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">
                Escolha uma rede, uma conta específica ou veja tudo consolidado.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 w-full lg:w-auto">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#9CA3AF]">Rede</label>
                <div className="flex flex-wrap gap-2">
                  {(["all", "instagram", "facebook"] as SocialNetworkFilter[]).map(
                    (network) => {
                      const active = selectedNetwork === network;
                      const label =
                        network === "all" ? "Consolidado" : formatNetwork(network);

                      return (
                        <button
                          key={network}
                          type="button"
                          onClick={() => setSelectedNetwork(network)}
                          className={`px-3 py-1.5 rounded-full border text-xs transition ${
                            active
                              ? "border-[#7C3AED] bg-[#2A1458] text-white"
                              : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 md:col-span-2 xl:col-span-1">
                <label className="text-[11px] text-[#9CA3AF]">Conta</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="rounded-xl border border-[#272046] bg-[#020012] text-sm text-white px-3 py-2 outline-none"
                >
                  <option value="all">
                    {selectedNetwork === "all"
                      ? "Todas as contas"
                      : `Todas as contas de ${formatNetwork(selectedNetwork)}`}
                  </option>

                  {networkAccounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {formatNetwork(acc.network)} • {acc.name || acc.username || acc.id}
                      {acc.accountType ? ` • ${acc.accountType}` : ""}
                      {acc.isPrimary ? " • principal" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#9CA3AF]">Origem atual</label>
                <div className="rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white">
                  {sourceLabel}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {insightsError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {insightsError}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Seguidores"
          value={followersValue}
          diff={sourceLabel}
          tone="neutral"
        />
        <StatCard
          label="Publicações"
          value={mediaCountValue}
          diff="total"
          tone="neutral"
        />
        <StatCard
          label="Mensagens respondidas"
          value={repliedRateValue}
          diff={repliedRateDiff}
          tone={repliedRateTone}
        />
        <StatCard
          label="Concorrentes monitorados"
          value={competitorsCountValue}
          diff={competitorsStatusLabel}
          tone="neutral"
        />
      </div>

      <div className="grid lg:grid-cols-[1.4fr,0.9fr] gap-4">
        <EngagementChart
          selectedNetwork={selectedNetwork}
          selectedAccountId={selectedAccountId}
          workspaceId={workspaceId}
          selectedRange={selectedRange}
        />

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
                rede={formatNetwork((post.networks || [])[0])}
                horario={formatScheduledDate(post.runAt)}
                titulo={post.title || post.content?.text || "Post agendado"}
              />
            ))
          )}
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr,0.9fr] gap-4">
        <FollowersHistoryChart history={history} loading={loadingHistory} />
        <CompetitorsChart workspaceId={workspaceId} />
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
    history.length > 0
      ? history.map((item) => item.followersCount)
      : [0, 0, 0, 0, 0, 0, 0];

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
        snapshots das redes conectadas.
      </p>
    </motion.div>
  );
}

function CompetitorsChart({ workspaceId }: { workspaceId: string | null }) {
  const [loading, setLoading] = useState(true);
  const [competitors, setCompetitors] = useState<
    { name: string; score: number; color: string }[]
  >([]);
  const [leader, setLeader] = useState(false);
  const [ownScore, setOwnScore] = useState(0);

  useEffect(() => {
    if (!workspaceId) {
      setCompetitors([]);
      setLeader(false);
      setOwnScore(0);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadCompetitors() {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/dashboard/competitors?workspaceId=${encodeURIComponent(workspaceId)}`,
          {
            signal: controller.signal,
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const json = await res.json();

        if (!json?.ok) {
          throw new Error(json?.message || "Erro ao carregar concorrentes.");
        }

        const palette = ["#C026D3", "#0EA5E9", "#8B5CF6", "#22C55E", "#F59E0B"];

        const loaded = (json.data?.competitors || []).map((item: any, index: number) => ({
          name: item.name,
          score: Number(item.score || 0),
          color: palette[index % palette.length],
        }));

        setCompetitors(loaded);
        setLeader(!!json.data?.leader);
        setOwnScore(Number(json.data?.ownScore || 0));
      } catch (error) {
        console.error("Failed to load competitors", error);
        setCompetitors([]);
        setLeader(false);
        setOwnScore(0);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCompetitors();

    return () => controller.abort();
  }, [workspaceId]);

  const chartRows = useMemo(() => {
    const rows = [{ name: "Você", score: ownScore, color: "#7C3AED" }, ...competitors];
    return rows.filter((row) => row.score > 0 || row.name === "Você");
  }, [competitors, ownScore]);

  const max = Math.max(...chartRows.map((c) => c.score), 1);

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
          {leader ? "Você está à frente 🔥" : "Monitorando concorrentes"}
        </span>
      </div>

      {loading ? (
        <p className="text-[11px] text-[#9CA3AF]">Carregando concorrentes...</p>
      ) : chartRows.length <= 1 ? (
        <p className="text-[11px] text-[#9CA3AF]">
          Cadastre concorrentes para visualizar a comparação real.
        </p>
      ) : (
        <div className="space-y-2 mt-2">
          {chartRows.map((c) => (
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
      )}

      <p className="mt-2 text-[11px] text-[#9CA3AF]">
        Use os relatórios detalhados para entender o que os concorrentes estão
        fazendo e onde você pode abrir ainda mais vantagem.
      </p>
    </motion.div>
  );
}
