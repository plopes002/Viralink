// src/app/(app)/supporters/leads/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";

type PrimaryAccount = {
  id: string;
  name: string;
  username: string;
};

type Lead = {
  id: string;
  instagramUsername: string;
  note?: string;
  status: string;
  sourceName: string;
  sourceUsername?: string;
  createdAt?: string;
};

export default function SupporterLeadsPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const [primaryAccounts, setPrimaryAccounts] = useState<PrimaryAccount[]>([]);
  const [selectedPrimaryId, setSelectedPrimaryId] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPrimaryAccounts() {
    if (!workspaceId) return;

    const res = await fetch(`/api/network/primary/list?workspaceId=${workspaceId}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (data.ok) {
      const loadedAccounts = data.accounts || [];
      setPrimaryAccounts(loadedAccounts);
    
      if (loadedAccounts.length && !selectedPrimaryId) {
        const primary =
          loadedAccounts.find((acc: any) => acc.role === "primary") ||
          loadedAccounts[0];
    
        setSelectedPrimaryId(primary.id);
      }
    }
  }

  async function loadLeads() {
    if (!workspaceId || !selectedPrimaryId) {
      setLeads([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/network/leads/list?workspaceId=${workspaceId}&primaryAccountId=${selectedPrimaryId}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (data.ok) {
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error("[supporters/leads] erro:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrimaryAccounts();
  }, [workspaceId]);

  useEffect(() => {
    loadLeads();
  }, [workspaceId, selectedPrimaryId]);

  const selectedPrimary = useMemo(
    () => primaryAccounts.find((acc) => acc.id === selectedPrimaryId) || null,
    [primaryAccounts, selectedPrimaryId]
  );

  return (
    <section className="mt-4 flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-semibold text-white">Leads da rede</h1>
        <p className="text-xs text-[#9CA3AF]">
          Leads originados dos comentários da conta principal e dos apoiadores.
        </p>
      </header>

      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        <select
          value={selectedPrimaryId}
          onChange={(e) => setSelectedPrimaryId(e.target.value)}
          className="rounded-xl border border-[#272046] bg-[#020012] text-sm text-white px-3 py-2 outline-none"
        >
          {primaryAccounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} {acc.username ? `(${acc.username})` : ""}
            </option>
          ))}
        </select>

        {selectedPrimary && (
          <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-3">
            <p className="text-sm text-white font-medium">{selectedPrimary.name}</p>
            <p className="text-xs text-[#9CA3AF]">{selectedPrimary.username}</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        {loading ? (
          <p className="text-xs text-[#9CA3AF]">Carregando leads...</p>
        ) : leads.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">
            Nenhum lead gerado ainda.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-xl border border-[#272046] bg-[#0A0322] p-4"
              >
                <p className="text-sm font-medium text-white">
                  @{lead.instagramUsername}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Origem: {lead.sourceName} {lead.sourceUsername || ""}
                </p>
                <p className="text-xs text-white mt-3">
                  {lead.note || "Sem observação"}
                </p>
                <span className="mt-3 inline-flex px-3 py-1 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400">
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}