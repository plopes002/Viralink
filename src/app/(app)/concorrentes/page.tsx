// app/(app)/concorrentes/page.tsx
"use client";

import { useMemo, useState } from "react";
import {
  FiTrendingUp,
  FiUsers,
  FiActivity,
  FiAlertCircle,
  FiPlus,
} from "react-icons/fi";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification } from "@/types/notification";
import { useUser } from "@/firebase/provider";
import { CompetitorAnalyticsSection } from "./components/CompetitorAnalyticsSection";
import { useCompetitorMetrics } from "@/hooks/useCompetitorMetrics";
import { useAccountMetrics } from "@/hooks/useAccountMetrics";
import { CompetitorVsBrandSection } from "./components/CompetitorVsBrandSection";

// TODO: trocar por seus hooks reais de user/workspace
function useCurrentUserAndWorkspace() {
  const { user } = useUser();
  // TODO: Replace with dynamic workspace ID from context
  const workspaceId = user ? "agency_123" : null;

  return {
    uid: user?.uid ?? null,
    workspaceId: workspaceId,
  };
}

// Tipo base do concorrente no front (espelhando o Firestore)
interface Competitor {
  id: string;
  workspaceId: string;
  name: string;
  handle: string;
  network: "instagram" | "facebook" | "tiktok" | "youtube";
  profileUrl: string;
  avatarUrl?: string | null;
  isActive: boolean;
  planIncluded: boolean;
  extraCharge?: boolean;

  followers: number;
  postsLast7d?: number;
  followersDelta7d?: number;
  engagementRate7d?: number;
}

// TODO: remover mock e carregar de Firestore
const mockCompetitors: Competitor[] = [
  {
    id: "c1",
    workspaceId: "agency_123",
    name: "Studio Glow",
    handle: "@studioglow",
    network: "instagram",
    profileUrl: "https://instagram.com/studioglow",
    avatarUrl: null,
    isActive: true,
    planIncluded: true,
    followers: 18450,
    postsLast7d: 9,
    followersDelta7d: 320,
    engagementRate7d: 7.8,
  },
  {
    id: "c2",
    workspaceId: "agency_123",
    name: "Beleza Prime",
    handle: "@belezaprime",
    network: "facebook",
    profileUrl: "https://facebook.com/belezaprime",
    avatarUrl: null,
    isActive: true,
    planIncluded: true,
    followers: 23210,
    postsLast7d: 4,
    followersDelta7d: 110,
    engagementRate7d: 5.2,
  },
  {
    id: "c3",
    workspaceId: "agency_123",
    name: "Clínica Aura",
    handle: "@clinicaaura",
    network: "instagram",
    profileUrl: "https://instagram.com/clinicaaura",
    avatarUrl: null,
    isActive: true,
    planIncluded: true,
    followers: 9870,
    postsLast7d: 7,
    followersDelta7d: 410,
    engagementRate7d: 9.1,
  },
];

function formatNumber(n: number | undefined) {
  if (n == null) return "-";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(".", ",") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".", ",") + "k";
  return n.toString();
}

function networkLabel(network: Competitor["network"]) {
  switch (network) {
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "tiktok":
      return "TikTok";
    case "youtube":
      return "YouTube";
  }
}

export default function CompetitorsPage() {
  const { uid, workspaceId } = useCurrentUserAndWorkspace();

  // TODO: filtrar concorrentes pelo workspaceId real
  const competitors = mockCompetitors;

  const [selectedId, setSelectedId] = useState<string | null>(
    competitors[0]?.id ?? null,
  );

  const selected = useMemo(
    () => competitors.find((c) => c.id === selectedId) ?? competitors[0] ?? null,
    [competitors, selectedId],
  );

  const {
    notifications,
    unreadCount,
    loading: loadingNotifs,
  } = useNotifications(workspaceId, uid);

  const competitorAlerts: Notification[] = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.type === "competitor_alert" &&
          (!selected || n.competitorId === selected.id),
      ),
    [notifications, selected],
  );

  const totalCompetitors = competitors.length;
  const networksSet = new Set(competitors.map((c) => c.network));
  const totalNetworks = networksSet.size;

  const bestEngagement = competitors.reduce<Competitor | null>(
    (best, c) => {
      if (c.engagementRate7d == null) return best;
      if (!best || (best.engagementRate7d ?? 0) < c.engagementRate7d) return c;
      return best;
    },
    null,
  );
  
  // TODO: pegar accountId real da conta principal (rede social do cliente)
  const currentAccountId = "main_account_123"; // trocar depois

  // métricas da conta principal (minha marca)
  const {
    followers7d: myFollowers7d,
    clicks7d: myClicks7d,
    engagement7d: myEngagement7d,
  } = useAccountMetrics(currentAccountId);

  // métricas do concorrente selecionado
  const {
    followers7d: competitorFollowers7d,
    clicks7d: competitorClicks7d,
    engagement7d: competitorEngagement7d,
  } = useCompetitorMetrics(selected?.id ?? null);


  return (
    <section className="mt-4 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Concorrentes
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 max-w-2xl">
            Compare o desempenho da sua marca com até 3 concorrentes por rede,
            acompanhe crescimento, engajamento e receba alertas inteligentes
            quando alguém disparar nas redes sociais.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-medium text-white"
          style={{
            background:
              "linear-gradient(90deg,#7C3AED 0%,#EC4899 50%,#0EA5E9 100%)",
          }}
        >
          <FiPlus size={13} />
          Adicionar concorrente
        </button>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[#261341] bg-[#050017] px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-300">
            <FiTrendingUp size={16} />
          </div>
          <div>
            <p className="text-[10px] text-[#9CA3AF]">Concorrentes monitorados</p>
            <p className="text-lg font-semibold text-white">
              {totalCompetitors}
            </p>
            <p className="text-[10px] text-[#6B7280]">
              Incluídos no plano Expert
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#261341] bg-[#050017] px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sky-500/10 border border-sky-500/40 flex items-center justify-center text-sky-300">
            <FiUsers size={16} />
          </div>
          <div>
            <p className="text-[10px] text-[#9CA3AF]">Redes analisadas</p>
            <p className="text-lg font-semibold text-white">
              {totalNetworks}
            </p>
            <p className="text-[10px] text-[#6B7280]">
              Instagram, Facebook, etc.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#261341] bg-[#050017] px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-red-500/10 border border-red-500/40 flex items-center justify-center text-red-300">
            <FiAlertCircle size={16} />
          </div>
          <div>
            <p className="text-[10px] text-[#9CA3AF]">Alertas recentes</p>
            <p className="text-lg font-semibold text-white">
              {loadingNotifs ? "..." : competitorAlerts.length}
            </p>
            <p className="text-[10px] text-[#6B7280]">
              Baseado em atividade de concorrentes
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#261341] bg-[#050017] px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
            <FiActivity size={16} />
          </div>
          <div>
            <p className="text-[10px] text-[#9CA3AF]">Melhor engajamento 7 dias</p>
            <p className="text-lg font-semibold text-white">
              {bestEngagement?.engagementRate7d != null
                ? `${bestEngagement.engagementRate7d.toFixed(1)}%`
                : "-"}
            </p>
            <p className="text-[10px] text-[#6B7280]">
              {bestEngagement
                ? `${bestEngagement.name} (${networkLabel(
                    bestEngagement.network,
                  )})`
                : "Aguardando dados"}
            </p>
          </div>
        </div>
      </div>

      {/* layout principal: lista + painel detalhado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LISTA DE CONCORRENTES */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
            Concorrentes monitorados
          </h2>
          <div className="rounded-2xl border border-[#261341] bg-[#050017] divide-y divide-[#1F1134]">
            {competitors.map((c) => {
              const isSelected = selected?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-[#0B001F] transition ${
                    isSelected ? "bg-[#0B001F]" : "bg-transparent"
                  }`}
                >
                  {/* avatar "fake" por enquanto */}
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-sky-500 flex items-center justify-center text-[11px] font-semibold">
                    {c.name
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] text-white truncate">
                        {c.name}
                      </p>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#1F1134] text-[#E5E7EB]">
                        {networkLabel(c.network)}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#9CA3AF] truncate">
                      {c.handle}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-[#6B7280]">
                      <span>Seg.: {formatNumber(c.followers)}</span>
                      {c.postsLast7d != null && (
                        <>
                          <span>•</span>
                          <span>Posts 7d: {c.postsLast7d}</span>
                        </>
                      )}
                      {c.engagementRate7d != null && (
                        <>
                          <span>•</span>
                          <span>
                            Engaj. 7d: {c.engagementRate7d.toFixed(1)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full ${
                        c.planIncluded
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {c.planIncluded ? "Incluído" : "Extra"}
                    </span>
                    {c.followersDelta7d != null && (
                      <span className="text-[9px] text-emerald-300">
                        +{c.followersDelta7d} seg. /7d
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PAINEL DETALHADO */}
        <div className="lg:col-span-2 space-y-3">
          {selected ? (
            <>
              <div className="rounded-2xl border border-[#261341] bg-[#050017] p-4 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="text-xs text-[#9CA3AF] mb-1">
                      Visão detalhada
                    </p>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">
                        {selected.name}
                      </h2>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1F1134] text-[#E5E7EB]">
                        {networkLabel(selected.network)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {selected.handle} • {formatNumber(selected.followers)}{" "}
                      seguidores
                    </p>
                  </div>
                  <a
                    href={selected.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] px-3 py-1.5 rounded-full border border-[#312356] text-[#E5E7EB] hover:bg-white/5"
                  >
                    Ver perfil na rede
                  </a>
                </div>

                <CompetitorAnalyticsSection
                  followers7d={competitorFollowers7d}
                  clicks7d={competitorClicks7d}
                  engagement7d={competitorEngagement7d}
                />
                
                {selected && (
                  <CompetitorVsBrandSection
                    brandName="Sua Marca (Exemplo)" // depois você pega do contexto
                    brandFollowers7d={myFollowers7d}
                    brandEngagement7d={myEngagement7d}
                    competitorName={selected.name}
                    competitorFollowers7d={competitorFollowers7d}
                    competitorEngagement7d={competitorEngagement7d}
                  />
                )}


                {/* cards de resumo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  <div className="rounded-2xl border border-[#1F1134] bg-[#050017] px-3 py-3">
                    <p className="text-[10px] text-[#9CA3AF] mb-1">
                      Seguidores atuais
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {formatNumber(selected.followers)}
                    </p>
                    {selected.followersDelta7d != null && (
                      <p className="text-[10px] text-emerald-300">
                        +{selected.followersDelta7d} em 7 dias
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-[#1F1134] bg-[#050017] px-3 py-3">
                    <p className="text-[10px] text-[#9CA3AF] mb-1">
                      Posts nos últimos 7 dias
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {selected.postsLast7d ?? "-"}
                    </p>
                    <p className="text-[10px] text-[#6B7280]">
                      Frequência de conteúdo
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#1F1134] bg-[#050017] px-3 py-3">
                    <p className="text-[10px] text-[#9CA3AF] mb-1">
                      Engajamento médio 7 dias
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {selected.engagementRate7d != null
                        ? `${selected.engagementRate7d.toFixed(1)}%`
                        : "-"}
                    </p>
                    <p className="text-[10px] text-[#6B7280]">
                      Curtidas + comentários / alcance
                    </p>
                  </div>
                </div>
              </div>

              {/* bloco de alertas ligados a notifications.competitor_alert */}
              <div className="rounded-2xl border border-[#261341] bg-[#050017] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Alertas do concorrente
                    </p>
                    <p className="text-[10px] text-[#9CA3AF]">
                      Eventos recentes gerados automaticamente pelo monitoramento.
                    </p>
                  </div>
                </div>

                {loadingNotifs && (
                  <p className="text-[11px] text-[#9CA3AF]">Carregando...</p>
                )}

                {!loadingNotifs && competitorAlerts.length === 0 && (
                  <p className="text-[11px] text-[#9CA3AF]">
                    Nenhum alerta recente para este concorrente.
                  </p>
                )}

                {!loadingNotifs && competitorAlerts.length > 0 && (
                  <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
                    {competitorAlerts.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-2 px-3 py-2 rounded-xl bg-[#0B001F] border border-[#1F1134]"
                      >
                        <div className="h-7 w-7 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-300">
                          <FiTrendingUp size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-[#E5E7EB]">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-[#6B7280] mt-0.5">
                            {(() => {
                              const diff =
                                Date.now() - n.createdAt.getTime();
                              const min = Math.floor(diff / 60000);
                              if (min < 1) return "agora";
                              if (min < 60) return `${min} min atrás`;
                              const h = Math.floor(min / 60);
                              if (h < 24) return `${h} h atrás`;
                              const d = Math.floor(h / 24);
                              return `${d} d atrás`;
                            })()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-[#261341] bg-[#050017] p-6 text-center text-[11px] text-[#9CA3AF]">
              Nenhum concorrente selecionado.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}