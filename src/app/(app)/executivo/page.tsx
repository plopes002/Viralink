// src/app/(app)/executivo/page.tsx
"use client";

import { useWorkspace } from "@/hooks/useWorkspace";
import { useExecutiveMetrics } from "@/hooks/useExecutiveMetrics";
import { useQueuePolling } from "@/hooks/useQueuePolling";

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
      <p className="text-[11px] text-[#9CA3AF]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {helper && <p className="mt-1 text-[10px] text-[#7D8590]">{helper}</p>}
    </div>
  );
}

export default function ExecutivoPage() {
  const { currentWorkspace } = useWorkspace() as any;
  const workspaceId = currentWorkspace?.id;

  const { metrics, loading } = useExecutiveMetrics(workspaceId);

  useQueuePolling({
    enabled: !!workspaceId,
    intervalMs: 20000,
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-white">
          Dashboard Executivo
        </h1>
        <p className="text-sm text-[#9CA3AF]">
          Visão geral da operação do VIRALINK em tempo real.
        </p>
      </header>

      {loading && (
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-sm text-[#9CA3AF]">Carregando métricas...</p>
        </div>
      )}

      {!loading && (
        <>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Perfis consolidados"
              value={metrics.totalProfiles}
              helper="Base consolidada total"
            />
            <MetricCard
              label="Leads quentes"
              value={metrics.hotLeads}
              helper="Perfis com alta chance de ação"
            />
            <MetricCard
              label="Leads prioridade"
              value={metrics.priorityLeads}
              helper="Perfis mais valiosos da base"
            />
            <MetricCard
              label="Campanhas criadas"
              value={metrics.totalCampaigns}
              helper="Total acumulado"
            />
          </section>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Mensagens enviadas"
              value={metrics.sentMessages}
              helper="Envios concluídos"
            />
            <MetricCard
              label="Mensagens em fila"
              value={metrics.queuedMessages}
              helper="Aguardando processamento"
            />
            <MetricCard
              label="Mensagens processando"
              value={metrics.processingMessages}
              helper="Em execução agora"
            />
            <MetricCard
              label="Taxa de erro"
              value={`${metrics.errorRate}%`}
              helper="Erros sobre total de mensagens"
            />
          </section>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Fila pendente"
              value={metrics.queuePending}
              helper="Jobs aguardando"
            />
            <MetricCard
              label="Fila processando"
              value={metrics.queueProcessing}
              helper="Jobs em andamento"
            />
            <MetricCard
              label="Fila concluída"
              value={metrics.queueDone}
              helper="Jobs finalizados"
            />
            <MetricCard
              label="Fila com erro"
              value={metrics.queueErrors}
              helper="Jobs que precisam revisão"
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
              <h2 className="text-sm font-semibold text-white mb-4">
                Resumo de campanhas
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#020012] p-4">
                  <p className="text-[11px] text-[#9CA3AF]">Na fila</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {metrics.queuedCampaigns}
                  </p>
                </div>

                <div className="rounded-xl bg-[#020012] p-4">
                  <p className="text-[11px] text-[#9CA3AF]">Processando</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {metrics.processingCampaigns}
                  </p>
                </div>

                <div className="rounded-xl bg-[#020012] p-4">
                  <p className="text-[11px] text-[#9CA3AF]">Concluídas</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {metrics.doneCampaigns}
                  </p>
                </div>

                <div className="rounded-xl bg-[#020012] p-4">
                  <p className="text-[11px] text-[#9CA3AF]">Com erro</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {metrics.errorCampaigns}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
              <h2 className="text-sm font-semibold text-white mb-4">
                Resumo de mensagens
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#020012] p-4">
                  <p className="text-[11px] text-[#9CA3AF]">Total</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {metrics.totalMessages}
                  </p>
                </div>

                <div className="rounded-xl bg-[#020012] p-4">
                  <p className="text-[11px] text-[#9CA3AF]">Enviadas</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {metrics.sentMessages}
                  </p>
                </div>

                <div className="rounded-xl bg-[#020012] p-4">
                  <p className="text-[11px] text-[#9CA3AF]">Fila</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {metrics.queuedMessages}
                  </p>
                </div>

                <div className="rounded-xl bg-[#020012] p-4">
                  <p className="text-[11px] text-[#9CA3AF]">Erros</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {metrics.errorMessages}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
