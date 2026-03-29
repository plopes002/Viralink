// src/app/(app)/supporters/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUser } from "@/firebase/provider";
import { SupporterCard } from "@/components/supporters/SupporterCard";

type PrimaryAccount = {
  id: string;
  name: string;
  username: string;
  role: "primary";
};

type Supporter = {
  id: string;
  name: string;
  username?: string;
  status: string;
  permissions?: {
    allowContentBoost: boolean;
    allowLeadCapture: boolean;
    allowFollowerCampaigns: boolean;
  } | null;
};

type Stats = {
  total: number;
  active: number;
  revoked: number;
  leadEnabled: number;
};

export default function SupportersPage() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useUser();

  const workspaceId = currentWorkspace?.id ?? null;

  const [primaryAccounts, setPrimaryAccounts] = useState<PrimaryAccount[]>([]);
  const [selectedPrimaryId, setSelectedPrimaryId] = useState("");
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    revoked: 0,
    leadEnabled: 0,
  });

  const [inviteLink, setInviteLink] = useState("");
  const [supporterName, setSupporterName] = useState("");
  const [loadingPrimary, setLoadingPrimary] = useState(true);
  const [loadingSupporters, setLoadingSupporters] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);

  async function loadPrimaryAccounts() {
    if (!workspaceId) {
      setPrimaryAccounts([]);
      setLoadingPrimary(false);
      return;
    }

    try {
      setLoadingPrimary(true);

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
    } catch (error) {
      console.error("[supporters/page] erro ao carregar primárias:", error);
    } finally {
      setLoadingPrimary(false);
    }
  }

  async function loadSupporters() {
    if (!workspaceId || !selectedPrimaryId) {
      setSupporters([]);
      setStats({
        total: 0,
        active: 0,
        revoked: 0,
        leadEnabled: 0,
      });
      return;
    }

    try {
      setLoadingSupporters(true);

      const [listRes, statsRes] = await Promise.all([
        fetch(
          `/api/network/supporters/list?workspaceId=${workspaceId}&primaryAccountId=${selectedPrimaryId}`,
          { cache: "no-store" }
        ),
        fetch(
          `/api/network/supporters/stats?workspaceId=${workspaceId}&primaryAccountId=${selectedPrimaryId}`,
          { cache: "no-store" }
        ),
      ]);

      const listData = await listRes.json();
      const statsData = await statsRes.json();

      if (listData.ok) {
        setSupporters(listData.supporters || []);
      }

      if (statsData.ok) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error("[supporters/page] erro ao carregar apoiadores:", error);
    } finally {
      setLoadingSupporters(false);
    }
  }

  useEffect(() => {
    loadPrimaryAccounts();
  }, [workspaceId]);

  useEffect(() => {
    loadSupporters();
  }, [workspaceId, selectedPrimaryId]);

  const selectedPrimary = useMemo(
    () => primaryAccounts.find((acc) => acc.id === selectedPrimaryId) || null,
    [primaryAccounts, selectedPrimaryId]
  );

  async function handleCreateInvite() {
    if (!workspaceId || !selectedPrimaryId || !user?.uid) {
      alert("Workspace, conta principal ou usuário não identificados.");
      return;
    }

    try {
      setCreatingInvite(true);
      setInviteLink("");

      const res = await fetch("/api/network/supporter-invites/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          primaryAccountId: selectedPrimaryId,
          invitedByUserId: user.uid,
          supporterName: supporterName || null,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao criar convite.");
      }

      const absoluteLink = `${window.location.origin}${data.link}`;
      setInviteLink(absoluteLink);
      setSupporterName("");
    } catch (error: any) {
      alert(error?.message || "Erro ao criar convite.");
    } finally {
      setCreatingInvite(false);
    }
  }

  async function handleCopyInvite() {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      alert("Link copiado.");
    } catch {
      alert("Não foi possível copiar o link.");
    }
  }

  return (
    <section className="mt-4 flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-semibold text-white">Rede de apoiadores</h1>
        <p className="text-xs text-[#9CA3AF]">
          Gerencie a rede de contas vinculadas à conta principal.
        </p>
      </header>

      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-white">Conta principal</p>
          <p className="text-[11px] text-[#9CA3AF]">
            Escolha a conta principal da campanha.
          </p>
        </div>

        {loadingPrimary ? (
          <p className="text-xs text-[#9CA3AF]">Carregando contas principais...</p>
        ) : primaryAccounts.length === 0 ? (
          <p className="text-xs text-yellow-300">
            Nenhuma conta principal encontrada. Conecte o Instagram primeiro.
          </p>
        ) : (
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
        )}

        {selectedPrimary && (
          <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-3">
            <p className="text-sm text-white font-medium">{selectedPrimary.name}</p>
            <p className="text-xs text-[#9CA3AF]">{selectedPrimary.username}</p>
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Total</p>
          <p className="text-xl font-semibold text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Ativos</p>
          <p className="text-xl font-semibold text-emerald-400">{stats.active}</p>
        </div>
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Revogados</p>
          <p className="text-xl font-semibold text-rose-400">{stats.revoked}</p>
        </div>
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Leads habilitados</p>
          <p className="text-xl font-semibold text-sky-400">{stats.leadEnabled}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-white">Gerar convite</p>
          <p className="text-[11px] text-[#9CA3AF]">
            Crie um link para vincular um novo apoiador.
          </p>
        </div>

        <input
          type="text"
          value={supporterName}
          onChange={(e) => setSupporterName(e.target.value)}
          placeholder="Nome do apoiador (opcional)"
          className="rounded-xl border border-[#272046] bg-[#020012] text-sm text-white px-3 py-2 outline-none"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCreateInvite}
            disabled={!selectedPrimaryId || creatingInvite}
            className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-sm font-medium text-white px-4 py-2 disabled:opacity-60"
          >
            {creatingInvite ? "Gerando..." : "Gerar convite"}
          </button>

          {inviteLink && (
            <button
              type="button"
              onClick={handleCopyInvite}
              className="rounded-xl border border-[#272046] text-sm text-white px-4 py-2"
            >
              Copiar link
            </button>
          )}
        </div>

        {inviteLink && (
          <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-3">
            <p className="text-[11px] text-[#9CA3AF] mb-1">Link gerado</p>
            <p className="text-xs text-white break-all">{inviteLink}</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-white">Apoiadores vinculados</p>
          <p className="text-[11px] text-[#9CA3AF]">
            Gerencie permissões e status da sua rede.
          </p>
        </div>

        {loadingSupporters ? (
          <p className="text-xs text-[#9CA3AF]">Carregando apoiadores...</p>
        ) : supporters.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">
            Nenhum apoiador vinculado ainda.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {supporters.map((supporter) => (
              <SupporterCard
                key={supporter.id}
                supporter={supporter}
                onUpdated={loadSupporters}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}