// src/app/(app)/concorrentes/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useCompetitors } from "@/hooks/useCompetitors";
import { useCompetitorLeads } from "@/hooks/useCompetitorLeads";
import { simulateCompetitorLeads } from "@/lib/simulateCompetitorLeads";
import { importLeadToCRM } from "@/lib/importCompetitorLead";
import { useFirebase } from "@/firebase/provider";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useSocialMetricsHistory } from "@/hooks/useSocialMetricsHistory";
import CompetitorComparisonChart from "@/components/charts/CompetitorComparisonChart";
import CompetitorBarComparisonChart from "@/components/charts/CompetitorBarComparisonChart";
import {
  calculateVariationPercent,
  filterHistoryByPeriod,
  formatVariation,
} from "@/lib/metricsPeriod";
import { generateCompetitorInsights, generateSummary } from "@/lib/competitorInsights";
import type { CompetitorStrategyResult } from "@/types/competitorStrategy";
import { saveCompetitorStrategyHistory } from "@/firebase/competitorStrategyHistory";
import { useCompetitorStrategyHistory } from "@/hooks/useCompetitorStrategyHistory";
import { compareStrategySnapshots } from "@/lib/competitorStrategyComparison";
import { generateCompetitorAlerts } from "@/lib/competitorAlertsEngine";
import { buildCompetitorAlertKey } from "@/lib/competitorAlertDedup";
import { useCompetitorAlerts } from "@/hooks/useCompetitorAlerts";
import { createCompetitorAlert, markCompetitorAlertAsRead } from "@/firebase/competitorAlerts";
import { getCompetitorAlertAction } from "@/lib/competitorAlertActions";


function formatPercent(value?: number) {
  if (typeof value !== "number") return "-";
  return `${value.toFixed(1)}%`;
}

function truncateText(text?: string, max = 180) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default function ConcorrentesPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { currentWorkspace } = useWorkspace() as any;
  const workspaceId = currentWorkspace?.id;

  const { competitors, loading: loadingCompetitors } =
    useCompetitors(workspaceId);

  const { accounts, loading: loadingAccounts } = useSocialAccounts(workspaceId);

  const [selectedCompetitorId, setSelectedCompetitorId] =
    useState<string | null>(null);
    
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30);

  const selectedCompetitor = useMemo(
    () =>
      competitors.find((c) => c.id === selectedCompetitorId) || null,
    [competitors, selectedCompetitorId],
  );
  
  const primaryAccount = useMemo(() => {
    return (
      accounts.find((a: any) => a.isPrimary && a.status === "connected") ||
      accounts.find((a: any) => a.isPrimary) ||
      accounts.find((a: any) => a.status === "connected") ||
      accounts[0] ||
      null
    );
  }, [accounts]);

  const { history: accountHistory } = useSocialMetricsHistory(
    workspaceId,
    "account",
    primaryAccount?.id || null,
  );

  const { history: competitorHistory } = useSocialMetricsHistory(
    workspaceId,
    "competitor",
    selectedCompetitorId,
  );
  
  const filteredAccountHistory = useMemo(() => {
    return filterHistoryByPeriod(accountHistory, periodDays);
  }, [accountHistory, periodDays]);

  const filteredCompetitorHistory = useMemo(() => {
    return filterHistoryByPeriod(competitorHistory, periodDays);
  }, [competitorHistory, periodDays]);
  
  const variations = useMemo(() => {
    return {
      myFollowers: formatVariation(
        calculateVariationPercent(filteredAccountHistory, "followers"),
      ),
      competitorFollowers: formatVariation(
        calculateVariationPercent(filteredCompetitorHistory, "followers"),
      ),
  
      myEngagement: formatVariation(
        calculateVariationPercent(filteredAccountHistory, "engagementRate"),
      ),
      competitorEngagement: formatVariation(
        calculateVariationPercent(filteredCompetitorHistory, "engagementRate"),
      ),
  
      myLikes: formatVariation(
        calculateVariationPercent(filteredAccountHistory, "avgLikes"),
      ),
      competitorLikes: formatVariation(
        calculateVariationPercent(filteredCompetitorHistory, "avgLikes"),
      ),
  
      myComments: formatVariation(
        calculateVariationPercent(filteredAccountHistory, "avgComments"),
      ),
      competitorComments: formatVariation(
        calculateVariationPercent(filteredCompetitorHistory, "avgComments"),
      ),
    };
  }, [filteredAccountHistory, filteredCompetitorHistory]);


  useEffect(() => {
    if (!selectedCompetitorId && competitors.length > 0) {
      setSelectedCompetitorId(competitors[0].id);
    }
  }, [competitors, selectedCompetitorId]);

  const { leads, loading: loadingLeads } = useCompetitorLeads(
    workspaceId,
    selectedCompetitorId,
  );

  const [campaignMessage, setCampaignMessage] = useState(
    "Vi que você interagiu recentemente com um conteúdo 👀 Queria te mostrar um ponto que pode te interessar bastante. Se fizer sentido para você, acompanha a página porque sempre publicamos conteúdos relevantes por aqui.",
  );

  const [dispatching, setDispatching] = useState(false);
  const [importingAll, setImportingAll] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyResult, setStrategyResult] = useState<CompetitorStrategyResult | null>(null);
  const [contentStrategyLoading, setContentStrategyLoading] = useState(false);
  const [contentStrategyResult, setContentStrategyResult] = useState<any | null>(null);

  const { history: strategyHistory } = useCompetitorStrategyHistory(
    workspaceId,
    selectedCompetitorId,
  );

  const { alerts: competitorAlerts } = useCompetitorAlerts(
    workspaceId,
    selectedCompetitorId,
  );

  const strategyComparison = useMemo(() => {
    if (!strategyHistory || strategyHistory.length < 2) return null;
  
    const [current, previous] = strategyHistory;
    return compareStrategySnapshots(current, previous);
  }, [strategyHistory]);

  const totalLeads = leads.length;
  const engagedLeads = leads.filter((l) => l.hasInteracted).length;
  const notFollowers = leads.filter((l) => !l.isFollower).length;
  const positiveLeads = leads.filter((l) => l.sentiment === "positive").length;

  const comparison = useMemo(() => {
    const myAccount = {
      followers: primaryAccount?.followers || 0,
      engagementRate: primaryAccount?.engagementRate || 0,
      growthRate: primaryAccount?.growthRate || 0,
      avgLikes: primaryAccount?.avgLikes || 0,
      avgComments: primaryAccount?.avgComments || 0,
      name: primaryAccount?.name || "Minha conta",
    };
  
    const competitor = {
      followers: selectedCompetitor?.followers || 0,
      engagementRate: selectedCompetitor?.engagementRate || 0,
      growthRate: selectedCompetitor?.growthRate || 0,
      avgLikes: selectedCompetitor?.avgLikes || 0,
      avgComments: selectedCompetitor?.avgComments || 0,
      name: selectedCompetitor?.name || "Concorrente",
    };
  
    return { myAccount, competitor };
  }, [primaryAccount, selectedCompetitor]);
  
  const insights = useMemo(() => {
    return generateCompetitorInsights({
      my: comparison.myAccount,
      competitor: comparison.competitor,
    });
  }, [comparison]);

  const summary = useMemo(() => {
    return generateSummary(insights);
  }, [insights]);


  async function handleSimulateCapture() {
    if (!workspaceId || !selectedCompetitorId || !firestore) return;

    setSimulating(true);
    try {
      await simulateCompetitorLeads(firestore, workspaceId, selectedCompetitorId);
      alert("Leads simulados com sucesso.");
    } finally {
      setSimulating(false);
    }
  }

  async function handleImportAllToCRM() {
    if (!firestore) return;
    setImportingAll(true);
    try {
      for (const lead of leads) {
        await importLeadToCRM(firestore, lead);
      }
      alert(`${leads.length} lead(s) importado(s) para o CRM.`);
    } finally {
      setImportingAll(false);
    }
  }

  async function handleDispatchCompetitorCampaign() {
    if (!workspaceId || !campaignMessage.trim() || !selectedCompetitorId) return;

    setDispatching(true);
    try {
      const res = await fetch("/api/campaigns/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          name: `Campanha concorrente - ${selectedCompetitor?.name || "Concorrente"}`,
          channel: "instagram_dm",
          message: campaignMessage,
          audienceMode: "competitor",
          filters: {
            onlyNonFollowers: true,
            onlyEngaged: true,
            sentiment: "positive",
            competitorId: selectedCompetitorId,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao criar campanha de concorrente.");
        return;
      }

      alert(
        [
          "Campanha criada com sucesso.",
          `Risco: ${data.riskLevel || "n/a"}`,
          `Agendadas: ${data.scheduledCount ?? 0}`,
          `Em revisão: ${data.reviewCount ?? 0}`,
          `Puladas: ${data.skippedCount ?? 0}`,
        ].join("\n"),
      );
    } finally {
      setDispatching(false);
    }
  }
  
  async function handleGenerateStrategy() {
    if (!selectedCompetitor || !primaryAccount || !firestore || !selectedCompetitorId) return;
  
    setStrategyLoading(true);
    try {
      const res = await fetch("/api/competitors/generate-strategy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          myAccount: comparison.myAccount,
          competitor: comparison.competitor,
          periodDays,
          variations,
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        alert(data?.error || "Erro ao gerar análise estratégica.");
        return;
      }
  
      setStrategyResult(data);

      if (workspaceId && selectedCompetitorId) {
        const newSnapshot = {
          createdAt: new Date().toISOString(),
          periodDays,
          metrics: {
              myFollowers: comparison.myAccount.followers || 0,
              competitorFollowers: comparison.competitor.followers || 0,
              myEngagementRate: comparison.myAccount.engagementRate || 0,
              competitorEngagementRate: comparison.competitor.engagementRate || 0,
              myGrowthRate: comparison.myAccount.growthRate || 0,
              competitorGrowthRate: comparison.competitor.growthRate || 0,
              myAvgLikes: comparison.myAccount.avgLikes || 0,
              competitorAvgLikes: comparison.competitor.avgLikes || 0,
              myAvgComments: comparison.myAccount.avgComments || 0,
              competitorAvgComments: comparison.competitor.avgComments || 0,
          },
        };

        await saveCompetitorStrategyHistory(firestore, {
            workspaceId,
            competitorId: selectedCompetitorId,
            periodDays,
            summary: data.summary || "",
            strengths: data.strengths || [],
            weaknesses: data.weaknesses || [],
            opportunities: data.opportunities || [],
            recommendations: data.recommendations || [],
            suggestedCampaignTitle: data.suggestedCampaignTitle || null,
            suggestedCampaignMessage: data.suggestedCampaignMessage || null,
            metrics: newSnapshot.metrics,
            createdAt: newSnapshot.createdAt,
        });

        if (strategyHistory.length > 0) {
          const previousSnapshot = strategyHistory[0];
          const newAlerts = generateCompetitorAlerts({
            current: newSnapshot,
            previous: previousSnapshot,
          });
          const existingAlertKeys = new Set(competitorAlerts.map(a => a.metadata?.alertKey).filter(Boolean));

          for (const alert of newAlerts) {
            const alertKey = buildCompetitorAlertKey({
              competitorId: selectedCompetitorId,
              type: alert.type,
              periodDays,
            });

            if (!existingAlertKeys.has(alertKey)) {
              await createCompetitorAlert(firestore, {
                workspaceId,
                competitorId: selectedCompetitorId,
                type: alert.type,
                severity: alert.severity,
                title: alert.title,
                description: alert.description,
                periodDays,
                isRead: false,
                metadata: {
                  ...(alert.metadata || {}),
                  alertKey,
                },
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
      }
    } finally {
      setStrategyLoading(false);
    }
  }

  async function handleAlertAction(alert: any) {
    const action = getCompetitorAlertAction(alert);
    if (!action) return;
  
    if (action.type === "open_campaign") {
      const message =
        "Olá! Temos compartilhado conteúdos que podem te interessar bastante sobre esse tema. Se fizer sentido para você, acompanhe nossa página para ver mais atualizações.";
  
      const params = new URLSearchParams({
        audienceMode: "competitor",
        competitorId: String(alert.competitorId || ""),
        message,
        name: `Campanha sugerida - ${selectedCompetitor?.name || "Concorrente"}`,
      });
  
      router.push(`/campanhas?${params.toString()}`);
      return;
    }
  
    if (action.type === "generate_content_strategy") {
      setContentStrategyLoading(true);
      try {
        const res = await fetch("/api/competitors/generate-content-strategy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            myAccount: comparison.myAccount,
            competitor: comparison.competitor,
            periodDays,
            alertTitle: alert.title,
            alertDescription: alert.description,
          }),
        });
  
        const data = await res.json();
  
        if (!res.ok) {
          alert(data?.error || "Erro ao gerar estratégia de conteúdo.");
          return;
        }
  
        setContentStrategyResult(data);
        return;
      } finally {
        setContentStrategyLoading(false);
      }
    }
  
    if (action.type === "import_leads_to_crm") {
      if (!firestore) return;
      const leadsToImport = leads.filter(
        (lead) => lead.competitorId === alert.competitorId,
      );
  
      for (const lead of leadsToImport) {
        await importLeadToCRM(firestore, lead);
      }
  
      alert(`${leadsToImport.length} lead(s) importado(s) para o CRM.`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Concorrentes</h1>
          <p className="text-sm text-[#9CA3AF]">
            Compare desempenho, capture leads do concorrente selecionado e transforme em ação.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSimulateCapture}
            disabled={!selectedCompetitorId || simulating}
            className="rounded-xl border border-[#272046] px-4 py-2 text-sm text-white hover:bg-[#111827] disabled:opacity-60"
          >
            {simulating ? "Simulando..." : "Simular captura de leads"}
          </button>

          <button
            type="button"
            onClick={handleImportAllToCRM}
            disabled={importingAll || leads.length === 0}
            className="rounded-xl border border-[#272046] px-4 py-2 text-sm text-white hover:bg-[#111827] disabled:opacity-60"
          >
            {importingAll ? "Importando..." : "Adicionar todos ao CRM"}
          </button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* lista real de concorrentes */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <h2 className="text-sm font-semibold text-white mb-4">
            Concorrentes cadastrados
          </h2>

          {loadingCompetitors && (
            <p className="text-sm text-[#9CA3AF]">Carregando concorrentes...</p>
          )}

          {!loadingCompetitors && competitors.length === 0 && (
            <p className="text-sm text-[#9CA3AF]">
              Nenhum concorrente cadastrado.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {competitors.map((competitor) => (
              <button
                key={competitor.id}
                type="button"
                onClick={() => setSelectedCompetitorId(competitor.id)}
                className={`text-left rounded-2xl border p-4 transition ${
                  selectedCompetitorId === competitor.id
                    ? "border-[#8B5CF6] bg-[#111827]"
                    : "border-[#272046] bg-[#020012] hover:bg-[#0B1120]"
                }`}
              >
                <p className="text-sm font-medium text-white">
                  {competitor.name}
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  @{competitor.username || "-"} • {competitor.platform || "-"}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-[#7D8590]">Seguidores</p>
                    <p className="text-xs text-white">
                      {competitor.followers ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#7D8590]">Engajamento</p>
                    <p className="text-xs text-white">
                      {formatPercent(competitor.engagementRate)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* painel principal */}
        <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
            <p className="text-[11px] text-[#9CA3AF]">Conta principal utilizada</p>
            <p className="mt-1 text-sm text-white">
                {loadingAccounts
                ? "Carregando..."
                : primaryAccount
                ? `${primaryAccount.name} (@${primaryAccount.username || "-"})`
                : "Nenhuma conta principal cadastrada."}
            </p>
        </div>
          {/* comparação */}
          <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
            <h2 className="text-sm font-semibold text-white mb-4">
              Comparação: {comparison.myAccount.name} × {comparison.competitor.name}
            </h2>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-xl bg-[#020012] p-4">
                <p className="text-[11px] text-[#9CA3AF]">Seguidores</p>
                <p className="mt-2 text-xs text-[#E5E7EB]">
                  {comparison.myAccount.name}: {comparison.myAccount.followers}
                </p>
                <p className="text-xs text-white">
                  {comparison.competitor.name}: {comparison.competitor.followers}
                </p>
              </div>

              <div className="rounded-xl bg-[#020012] p-4">
                <p className="text-[11px] text-[#9CA3AF]">Engajamento</p>
                <p className="mt-2 text-xs text-[#E5E7EB]">
                  {comparison.myAccount.name}: {formatPercent(comparison.myAccount.engagementRate)}
                </p>
                <p className="text-xs text-white">
                  {comparison.competitor.name}: {formatPercent(comparison.competitor.engagementRate)}
                </p>
              </div>

              <div className="rounded-xl bg-[#020012] p-4">
                <p className="text-[11px] text-[#9CA3AF]">Crescimento</p>
                <p className="mt-2 text-xs text-[#E5E7EB]">
                  {comparison.myAccount.name}: {formatPercent(comparison.myAccount.growthRate)}
                </p>
                <p className="text-xs text-white">
                  {comparison.competitor.name}: {formatPercent(comparison.competitor.growthRate)}
                </p>
              </div>

              <div className="rounded-xl bg-[#020012] p-4">
                <p className="text-[11px] text-[#9CA3AF]">Média de curtidas</p>
                <p className="mt-2 text-xs text-[#E5E7EB]">
                  {comparison.myAccount.name}: {comparison.myAccount.avgLikes}
                </p>
                <p className="text-xs text-white">
                  {comparison.competitor.name}: {comparison.competitor.avgLikes}
                </p>
              </div>

              <div className="rounded-xl bg-[#020012] p-4">
                <p className="text-[11px] text-[#9CA3AF]">Média de comentários</p>
                <p className="mt-2 text-xs text-[#E5E7EB]">
                  {comparison.myAccount.name}: {comparison.myAccount.avgComments}
                </p>
                <p className="text-xs text-white">
                  {comparison.competitor.name}: {comparison.competitor.avgComments}
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[11px] text-[#9CA3AF]">Período de análise</p>
                  <p className="text-sm text-white">
                    Comparação temporal entre conta principal e concorrente selecionado
                  </p>
                </div>

                <div className="flex gap-2">
                  {[7, 30, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setPeriodDays(days as 7 | 30 | 90)}
                      className={`rounded-xl px-4 py-2 text-sm ${
                        periodDays === days
                          ? "bg-[#8B5CF6] text-white"
                          : "border border-[#272046] text-white hover:bg-[#111827]"
                      }`}
                    >
                      {days} dias
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
                <p className="text-[11px] text-[#9CA3AF]">Variação de seguidores</p>
                <p className="mt-2 text-xs text-[#E5E7EB]">
                  {comparison.myAccount.name}: {variations.myFollowers}
                </p>
                <p className="text-xs text-white">
                  {comparison.competitor.name}: {variations.competitorFollowers}
                </p>
              </div>

              <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
                <p className="text-[11px] text-[#9CA3AF]">Variação de engajamento</p>
                <p className="mt-2 text-xs text-[#E5E7EB]">
                  {comparison.myAccount.name}: {variations.myEngagement}
                </p>
                <p className="text-xs text-white">
                  {comparison.competitor.name}: {variations.competitorEngagement}
                </p>
              </div>

              <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
                <p className="text-[11px] text-[#9CA3AF]">Variação de likes médios</p>
                <p className="mt-2 text-xs text-[#E5E7EB]">
                  {comparison.myAccount.name}: {variations.myLikes}
                </p>
                <p className="text-xs text-white">
                  {comparison.competitor.name}: {variations.competitorLikes}
                </p>
              </div>

              <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
                <p className="text-[11px] text-[#9CA3AF]">Variação de comentários médios</p>
                <p className="mt-2 text-xs text-[#E5E7EB]">
                  {comparison.myAccount.name}: {variations.myComments}
                </p>
                <p className="text-xs text-white">
                  {comparison.competitor.name}: {variations.competitorComments}
                </p>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <CompetitorComparisonChart
                title={`Seguidores ao longo dos últimos ${periodDays} dias`}
                metric="followers"
                myLabel={comparison.myAccount.name}
                competitorLabel={comparison.competitor.name}
                myHistory={filteredAccountHistory}
                competitorHistory={filteredCompetitorHistory}
              />

              <CompetitorComparisonChart
                title={`Engajamento ao longo dos últimos ${periodDays} dias`}
                metric="engagementRate"
                myLabel={comparison.myAccount.name}
                competitorLabel={comparison.competitor.name}
                myHistory={filteredAccountHistory}
                competitorHistory={filteredCompetitorHistory}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <CompetitorBarComparisonChart
                title={`Likes médios no período de ${periodDays} dias`}
                metric="avgLikes"
                myLabel={comparison.myAccount.name}
                competitorLabel={comparison.competitor.name}
                myHistory={filteredAccountHistory}
                competitorHistory={filteredCompetitorHistory}
              />

              <CompetitorBarComparisonChart
                title={`Comentários médios no período de ${periodDays} dias`}
                metric="avgComments"
                myLabel={comparison.myAccount.name}
                competitorLabel={comparison.competitor.name}
                myHistory={filteredAccountHistory}
                competitorHistory={filteredCompetitorHistory}
              />
            </section>
            
            <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
              <h2 className="text-sm font-semibold text-white mb-3">
                Análise Rápida (Sintética)
              </h2>

              <p className="text-sm text-white mb-3">
                {summary}
              </p>

              <div className="flex flex-col gap-2">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className="rounded-lg bg-[#020012] px-3 py-2 text-xs text-[#E5E7EB]"
                  >
                    • {insight}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerateStrategy}
                disabled={strategyLoading || !selectedCompetitor || !primaryAccount}
                className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {strategyLoading ? "Gerando análise..." : "Gerar análise estratégica com IA"}
              </button>
            </div>
            
            {strategyResult && (
              <section className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Estratégia sugerida por IA
                  </h2>
                  <p className="mt-2 text-sm text-white">
                    {strategyResult.summary}
                  </p>
                </div>
            
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl bg-[#020012] p-4">
                    <p className="text-[11px] text-[#9CA3AF] mb-2">Forças</p>
                    <div className="flex flex-col gap-2">
                      {(strategyResult.strengths || []).map((item: string, idx: number) => (
                        <p key={idx} className="text-xs text-[#E5E7EB]">
                          • {item}
                        </p>
                      ))}
                    </div>
                  </div>
            
                  <div className="rounded-xl bg-[#020012] p-4">
                    <p className="text-[11px] text-[#9CA3AF] mb-2">Fraquezas</p>
                    <div className="flex flex-col gap-2">
                      {(strategyResult.weaknesses || []).map((item: string, idx: number) => (
                        <p key={idx} className="text-xs text-[#E5E7EB]">
                          • {item}
                        </p>
                      ))}
                    </div>
                  </div>
            
                  <div className="rounded-xl bg-[#020012] p-4">
                    <p className="text-[11px] text-[#9CA3AF] mb-2">Oportunidades</p>
                    <div className="flex flex-col gap-2">
                      {(strategyResult.opportunities || []).map((item: string, idx: number) => (
                        <p key={idx} className="text-xs text-[#E5E7EB]">
                          • {item}
                        </p>
                      ))}
                    </div>
                  </div>
            
                  <div className="rounded-xl bg-[#020012] p-4">
                    <p className="text-[11px] text-[#9CA3AF] mb-2">Recomendações</p>
                    <div className="flex flex-col gap-2">
                      {(strategyResult.recommendations || []).map((item: string, idx: number) => (
                        <p key={idx} className="text-xs text-[#E5E7EB]">
                          • {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
            
                {(strategyResult.suggestedCampaignTitle ||
                  strategyResult.suggestedCampaignMessage) && (
                  <div className="rounded-xl border border-[#272046] bg-[#020012] p-4">
                    <p className="text-[11px] text-[#9CA3AF] mb-2">Campanha sugerida</p>
            
                    {strategyResult.suggestedCampaignTitle && (
                      <p className="text-sm font-medium text-white mb-2">
                        {strategyResult.suggestedCampaignTitle}
                      </p>
                    )}
            
                    {strategyResult.suggestedCampaignMessage && (
                      <p className="text-xs text-[#E5E7EB] whitespace-pre-line">
                        {strategyResult.suggestedCampaignMessage}
                      </p>
                    )}
                    
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (!strategyResult) return;
                          setCampaignMessage(
                            strategyResult.suggestedCampaignMessage || campaignMessage,
                          );
                        }}
                        className="rounded-xl border border-[#272046] px-4 py-2 text-sm text-white hover:bg-[#111827]"
                      >
                        Usar mensagem sugerida na campanha
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {strategyComparison && (
              <section className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
                <h2 className="text-sm font-semibold text-white mb-3">
                  Comparação automática entre análises
                </h2>
            
                <p className="text-sm text-white mb-3">
                  {strategyComparison.summary}
                </p>
            
                <div className="flex flex-col gap-2">
                  {strategyComparison.insights.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg bg-[#020012] px-3 py-2 text-xs text-[#E5E7EB]"
                    >
                      • {item}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
              <h2 className="text-sm font-semibold text-white mb-4">
                Histórico de análises estratégicas
              </h2>

              {strategyHistory.length === 0 && (
                <p className="text-sm text-[#9CA3AF]">
                  Nenhuma análise salva ainda.
                </p>
              )}

              <div className="flex flex-col gap-3">
                {strategyHistory.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#272046] bg-[#020012] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-white font-medium">
                        {item.periodDays} dias
                      </p>

                      <p className="text-xs text-[#9CA3AF]">
                        {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <p className="mt-2 text-xs text-[#E5E7EB]">
                      {item.summary}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">
                  Alertas automáticos
                </h2>
                <span className="text-xs text-[#9CA3AF]">
                  {competitorAlerts.filter((a) => !a.isRead).length} não lido(s)
                </span>
              </div>

              {competitorAlerts.length === 0 && (
                <p className="text-sm text-[#9CA3AF]">
                  Nenhum alerta automático gerado ainda.
                </p>
              )}

              <div className="flex flex-col gap-3">
                {competitorAlerts.map((alert) => {
                  const action = getCompetitorAlertAction(alert);
                  return (
                    <div
                      key={alert.id}
                      className="rounded-xl border border-[#272046] bg-[#020012] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {alert.title}
                          </p>
                          <p className="mt-1 text-xs text-[#E5E7EB]">
                            {alert.description}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] ${
                            alert.severity === "critical"
                              ? "bg-rose-500/15 text-rose-400"
                              : alert.severity === "warning"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-sky-500/15 text-sky-400"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-[10px] text-[#9CA3AF]">
                          {new Date(alert.createdAt).toLocaleDateString("pt-BR")}
                        </p>

                        <div className="flex gap-2">
                          {action && (
                            <button
                              type="button"
                              onClick={() => handleAlertAction(alert)}
                              className="rounded-lg border border-[#272046] px-3 py-1.5 text-[11px] text-white hover:bg-[#111827]"
                            >
                              {action.label}
                            </button>
                          )}

                          {!alert.isRead && (
                            <button
                              type="button"
                              onClick={() => markCompetitorAlertAsRead(firestore, alert.id)}
                              className="rounded-lg border border-[#272046] px-3 py-1.5 text-[11px] text-white hover:bg-[#111827]"
                            >
                              Marcar como lido
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            
            {contentStrategyResult && (
              <section className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Estratégia de conteúdo sugerida
                  </h2>
                  <p className="mt-2 text-sm text-white">
                    {contentStrategyResult.summary}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl bg-[#020012] p-4">
                    <p className="text-[11px] text-[#9CA3AF] mb-2">Pilares de conteúdo</p>
                    <div className="flex flex-col gap-2">
                      {(contentStrategyResult.contentPillars || []).map(
                        (item: string, idx: number) => (
                          <p key={idx} className="text-xs text-[#E5E7EB]">
                            • {item}
                          </p>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#020012] p-4">
                    <p className="text-[11px] text-[#9CA3AF] mb-2">Formatos recomendados</p>
                    <div className="flex flex-col gap-2">
                      {(contentStrategyResult.recommendedFormats || []).map(
                        (item: string, idx: number) => (
                          <p key={idx} className="text-xs text-[#E5E7EB]">
                            • {item}
                          </p>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#020012] p-4">
                    <p className="text-[11px] text-[#9CA3AF] mb-2">Ações recomendadas</p>
                    <div className="flex flex-col gap-2">
                      {(contentStrategyResult.recommendedActions || []).map(
                        (item: string, idx: number) => (
                          <p key={idx} className="text-xs text-[#E5E7EB]">
                            • {item}
                          </p>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}


          {/* métricas dos leads capturados */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
              <p className="text-[11px] text-[#9CA3AF]">Leads capturados</p>
              <p className="mt-1 text-2xl font-semibold text-white">{totalLeads}</p>
            </div>

            <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
              <p className="text-[11px] text-[#9CA3AF]">Engajaram</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-400">
                {engagedLeads}
              </p>
            </div>

            <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
              <p className="text-[11px] text-[#9CA3AF]">Não seguem você</p>
              <p className="mt-1 text-2xl font-semibold text-rose-400">
                {notFollowers}
              </p>
            </div>

            <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
              <p className="text-[11px] text-[#9CA3AF]">Sentimento positivo</p>
              <p className="mt-1 text-2xl font-semibold text-sky-400">
                {positiveLeads}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            {/* leads */}
            <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
              <h2 className="text-sm font-semibold text-white mb-4">
                Leads capturados de {selectedCompetitor?.name || "concorrente"}
              </h2>

              {loadingLeads && (
                <p className="text-sm text-[#9CA3AF]">Carregando leads...</p>
              )}

              {!loadingLeads && leads.length === 0 && (
                <p className="text-sm text-[#9CA3AF]">
                  Nenhum lead capturado ainda para este concorrente.
                </p>
              )}

              <div className="flex flex-col gap-3">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-xl border border-[#272046] bg-[#020012] p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm text-white font-medium">
                        @{lead.username}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {lead.interactionType || "sem interação"} •{" "}
                        {lead.sentiment || "sem sentimento"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => importLeadToCRM(firestore, lead)}
                      className="rounded-lg border border-[#272046] px-3 py-1.5 text-[11px] text-white hover:bg-[#111827]"
                    >
                      Adicionar ao CRM
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* campanha */}
            <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Campanha para leads de concorrente
                </h2>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  A campanha usa automaticamente o concorrente ativo da tela.
                </p>
              </div>

              <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                <p className="text-[11px] text-[#7D8590] mb-2">
                  Regras da campanha
                </p>
                <div className="flex flex-col gap-1 text-xs text-[#E5E7EB]">
                  <p>• Apenas quem não segue você</p>
                  <p>• Apenas quem interagiu</p>
                  <p>• Apenas sentimento positivo</p>
                  <p>• Concorrente atual: {selectedCompetitor?.name || "-"}</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Mensagem
                </label>
                <textarea
                  value={campaignMessage}
                  onChange={(e) => setCampaignMessage(e.target.value)}
                  className="min-h-[180px] w-full rounded-2xl border border-[#272046] bg-[#020012] p-3 text-sm text-white"
                />
              </div>

              <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                <p className="text-[11px] text-[#7D8590] mb-2">
                  Preview rápido
                </p>
                <p className="text-xs text-[#E5E7EB]">
                  {truncateText(campaignMessage, 220)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDispatchCompetitorCampaign}
                disabled={dispatching || !selectedCompetitorId}
                className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {dispatching ? "Criando campanha..." : "Criar campanha de concorrente"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
