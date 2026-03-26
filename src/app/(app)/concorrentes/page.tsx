// src/app/(app)/concorrentes/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useCompetitorLeads } from "@/hooks/useCompetitorLeads";
import { simulateCompetitorLeads } from "@/lib/simulateCompetitorLeads";
import { importLeadToCRM } from "@/lib/importCompetitorLead";
import { useFirebase } from "@/firebase/provider";
import type { CompetitorLead } from "@/types/competitorLead";

function truncateText(text?: string, max = 140) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default function ConcorrentesPage() {
  const { currentWorkspace } = useWorkspace() as any;
  const { firestore } = useFirebase();
  const workspaceId = currentWorkspace?.id;

  const { leads, loading } = useCompetitorLeads(workspaceId);

  const [selectedCompetitorId, setSelectedCompetitorId] =
    useState("concorrente_1");

  const [campaignMessage, setCampaignMessage] = useState(
    "Vi que você interagiu recentemente com um conteúdo 👀 Queria te mostrar um ponto que pode te interessar bastante. Se fizer sentido para você, acompanha a página porque sempre publicamos conteúdos relevantes por aqui.",
  );

  const [dispatching, setDispatching] = useState(false);
  const [importingAll, setImportingAll] = useState(false);

  const totalLeads = leads.length;
  const engagedLeads = leads.filter((l) => l.hasInteracted).length;
  const notFollowers = leads.filter((l) => !l.isFollower).length;
  const positiveLeads = leads.filter((l) => l.sentiment === "positive").length;

  const leadsByCompetitor = useMemo(() => {
    const groups: Record<string, CompetitorLead[]> = {};
    for (const lead of leads) {
      const key = lead.competitorId || "sem_concorrente";
      if (!groups[key]) groups[key] = [];
      groups[key].push(lead);
    }
    return groups;
  }, [leads]);

  async function handleSimulateCapture() {
    if (!workspaceId || !firestore) return;
    await simulateCompetitorLeads(firestore, workspaceId, selectedCompetitorId);
    alert("Leads simulados com sucesso.");
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
    if (!workspaceId || !campaignMessage.trim()) return;

    setDispatching(true);
    try {
      const res = await fetch("/api/campaigns/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          name: "Campanha de concorrente",
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
            Analise concorrentes, capture leads, importe para o CRM e dispare campanhas específicas.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSimulateCapture}
            className="rounded-xl border border-[#272046] px-4 py-2 text-sm text-white hover:bg-[#111827]"
          >
            Simular captura de leads
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

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <h2 className="text-sm font-semibold text-white mb-4">
            Leads capturados dos concorrentes
          </h2>

          {loading && (
            <p className="text-sm text-[#9CA3AF]">Carregando leads...</p>
          )}

          {!loading && leads.length === 0 && (
            <p className="text-sm text-[#9CA3AF]">
              Nenhum lead capturado ainda.
            </p>
          )}

          <div className="flex flex-col gap-4">
            {Object.entries(leadsByCompetitor).map(([competitorId, group]) => (
              <div
                key={competitorId}
                className="rounded-xl border border-[#272046] bg-[#020012] p-4"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {competitorId}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      {group.length} lead(s)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCompetitorId(competitorId)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] ${
                      selectedCompetitorId === competitorId
                        ? "bg-[#8B5CF6]/20 text-white"
                        : "bg-[#111827] text-[#E5E7EB]"
                    }`}
                  >
                    Selecionar
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {group.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-xl border border-[#272046] p-3 flex items-center justify-between gap-3"
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
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Campanha para leads de concorrente
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Dispare uma campanha específica para quem interagiu com concorrentes.
            </p>
          </div>

          <div>
            <label className="block text-[11px] text-[#E5E7EB] mb-1">
              Concorrente selecionado
            </label>
            <select
              value={selectedCompetitorId}
              onChange={(e) => setSelectedCompetitorId(e.target.value)}
              className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
            >
              {Object.keys(leadsByCompetitor).length === 0 ? (
                <option value="concorrente_1">concorrente_1</option>
              ) : (
                Object.keys(leadsByCompetitor).map((competitorId) => (
                  <option key={competitorId} value={competitorId}>
                    {competitorId}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
            <p className="text-[11px] text-[#7D8590] mb-2">
              Regras desta campanha
            </p>
            <div className="flex flex-col gap-1 text-xs text-[#E5E7EB]">
              <p>• Apenas quem não segue você</p>
              <p>• Apenas quem interagiu</p>
              <p>• Apenas sentimento positivo</p>
              <p>• Pode ir para revisão se a regra de risco exigir</p>
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
            <p className="mt-2 text-[10px] text-[#9CA3AF]">
              O sistema adiciona contexto automático para leads de concorrente.
            </p>
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
            disabled={dispatching}
            className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {dispatching ? "Criando campanha..." : "Criar campanha de concorrente"}
          </button>
        </div>
      </section>
    </div>
  );
}
