// src/app/(app)/multi-conta/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useChildWorkspaces } from "@/hooks/useChildWorkspaces";
import { useMultiAccountDashboard } from "@/hooks/useMultiAccountDashboard";

export default function MultiContaPage() {
  const { currentWorkspace } = useWorkspace() as any;
  const masterWorkspaceId = currentWorkspace?.id;

  const { childWorkspaces, links, loading } =
    useChildWorkspaces(masterWorkspaceId);

  const { data, loading: loadingDashboard } =
    useMultiAccountDashboard(masterWorkspaceId);

  const activeChildren = useMemo(
    () => childWorkspaces.length,
    [childWorkspaces],
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Multi-conta</h1>
        <p className="text-sm text-[#9CA3AF]">
          Gerencie conta mestre, contas filhas, escopos de acesso e consolidação operacional.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Conta atual</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {currentWorkspace?.name || "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Contas filhas ativas</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {activeChildren}
          </p>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Links totais</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {links.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Modo</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {currentWorkspace?.kind || "standalone"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <h2 className="text-sm font-semibold text-white mb-4">
            Contas vinculadas
          </h2>

          {loading && (
            <p className="text-sm text-[#9CA3AF]">Carregando contas filhas...</p>
          )}

          {!loading && childWorkspaces.length === 0 && (
            <p className="text-sm text-[#9CA3AF]">
              Nenhuma conta filha vinculada.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {childWorkspaces.map((workspace: any) => {
              const link = links.find((l) => l.childWorkspaceId === workspace.id);

              return (
                <div
                  key={workspace.id}
                  className="rounded-xl border border-[#272046] bg-[#020012] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {workspace.name}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {workspace.kind || "child"}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] text-emerald-400">
                      {link?.status || "active"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div className="rounded-lg bg-[#111827] p-3">
                      <p className="text-[10px] text-[#9CA3AF]">Analytics</p>
                      <p className="text-sm text-white">
                        {link?.scopes?.analytics ? "Permitido" : "Bloqueado"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-[#111827] p-3">
                      <p className="text-[10px] text-[#9CA3AF]">Campanhas</p>
                      <p className="text-sm text-white">
                        {link?.scopes?.campaigns ? "Permitido" : "Bloqueado"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-[#111827] p-3">
                      <p className="text-[10px] text-[#9CA3AF]">CRM</p>
                      <p className="text-sm text-white">
                        {link?.scopes?.crm ? "Permitido" : "Bloqueado"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-[#111827] p-3">
                      <p className="text-[10px] text-[#9CA3AF]">Leads concorrente</p>
                      <p className="text-sm text-white">
                        {link?.scopes?.competitorLeads ? "Permitido" : "Bloqueado"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <h2 className="text-sm font-semibold text-white mb-4">
            Consolidação da conta mestre
          </h2>

          {loadingDashboard && (
            <p className="text-sm text-[#9CA3AF]">Carregando consolidação...</p>
          )}

          {!loadingDashboard && data?.totals && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-[#020012] p-4">
                <p className="text-[11px] text-[#9CA3AF]">Contatos totais</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {data.totals.totalContacts}
                </p>
              </div>

              <div className="rounded-xl bg-[#020012] p-4">
                <p className="text-[11px] text-[#9CA3AF]">Perfis totais</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {data.totals.totalProfiles}
                </p>
              </div>

              <div className="rounded-xl bg-[#020012] p-4">
                <p className="text-[11px] text-[#9CA3AF]">Campanhas totais</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {data.totals.totalCampaigns}
                </p>
              </div>

              <div className="rounded-xl bg-[#020012] p-4">
                <p className="text-[11px] text-[#9CA3AF]">Leads concorrente</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {data.totals.totalCompetitorLeads}
                </p>
              </div>

              <div className="rounded-xl bg-[#020012] p-4 md:col-span-2">
                <p className="text-[11px] text-[#9CA3AF]">Contas sociais totais</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {data.totals.totalSocialAccounts}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
