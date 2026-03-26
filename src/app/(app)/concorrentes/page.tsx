// src/app/(app)/concorrentes/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useCompetitors } from "@/hooks/useCompetitors";
import { useCompetitorLeads } from "@/hooks/useCompetitorLeads";
import { simulateCompetitorLeads } from "@/lib/simulateCompetitorLeads";
import { importLeadToCRM } from "@/lib/importCompetitorLead";
import { useFirebase } from "@/firebase/provider";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useSocialMetricsHistory } from "@/hooks/useSocialMetricsHistory";

function formatPercent(value?: number) {
  if (typeof value !== "number") return "-";
  return `${value.toFixed(1)}%`;
}

function truncateText(text?: string, max = 180) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default function ConcorrentesPage() {
  const { firestore } = useFirebase();
  const { currentWorkspace } = useWorkspace() as any;
  const workspaceId = currentWorkspace?.id;

  const { competitors, loading: loadingCompetitors } =
    useCompetitors(workspaceId);

  const { accounts, loading: loadingAccounts } = useSocialAccounts(workspaceId);

  const [selectedCompetitorId, setSelectedCompetitorId] =
    useState<string | null>(null);

  const selectedCompetitor = useMemo(
    () =>
      competitors.find((c) => c.id === selectedCompetitorId) || null,
    [competitors, selectedCompetitorId],
  );

  const primaryAccount = useMemo(() => {
    return accounts.find((a) => a.isPrimary) || accounts[0] || null;
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
            <h2 className="text-sm font-semibold text-white mb-4">
                Evolução temporal lado a lado
            </h2>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl bg-[#020012] p-4">
                <p className="text-[11px] text-[#9CA3AF] mb-3">
                    {comparison.myAccount.name}
                </p>

                <div className="flex flex-col gap-2">
                    {accountHistory.length === 0 && (
                    <p className="text-xs text-[#9CA3AF]">
                        Sem histórico disponível.
                    </p>
                    )}

                    {accountHistory.slice(-6).map((item) => (
                    <div
                        key={item.id}
                        className="rounded-lg border border-[#272046] px-3 py-2"
                    >
                        <p className="text-[10px] text-[#7D8590]">{item.date}</p>
                        <p className="text-xs text-white">
                        Seguidores: {item.followers ?? "-"} • Engajamento:{" "}
                        {typeof item.engagementRate === "number"
                            ? `${item.engagementRate.toFixed(1)}%`
                            : "-"}
                        </p>
                    </div>
                    ))}
                </div>
                </div>

                <div className="rounded-xl bg-[#020012] p-4">
                <p className="text-[11px] text-[#9CA3AF] mb-3">
                    {comparison.competitor.name}
                </p>

                <div className="flex flex-col gap-2">
                    {competitorHistory.length === 0 && (
                    <p className="text-xs text-[#9CA3AF]">
                        Sem histórico disponível.
                    </p>
                    )}

                    {competitorHistory.slice(-6).map((item) => (
                    <div
                        key={item.id}
                        className="rounded-lg border border-[#272046] px-3 py-2"
                    >
                        <p className="text-[10px] text-[#7D8590]">{item.date}</p>
                        <p className="text-xs text-white">
                        Seguidores: {item.followers ?? "-"} • Engajamento:{" "}
                        {typeof item.engagementRate === "number"
                            ? `${item.engagementRate.toFixed(1)}%`
                            : "-"}
                        </p>
                    </div>
                    ))}
                </div>
                </div>
            </div>
          </div>

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
