// src/app/(app)/supporters/interactions/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { InteractionCard } from "@/components/supporters/InteractionCard";

type PrimaryAccount = {
  id: string;
  name: string;
  username: string;
};

type Interaction = {
  id: string;
  sourceName: string;
  sourceUsername?: string;
  commenterUsername: string;
  commenterText: string;
  status: string;
  createdAt?: string;
};

type SupporterAccount = {
  id: string;
  name: string;
  username?: string;
  role: string;
};

export default function SupporterInteractionsPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const [primaryAccounts, setPrimaryAccounts] = useState<PrimaryAccount[]>([]);
  const [selectedPrimaryId, setSelectedPrimaryId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [supporters, setSupporters] = useState<SupporterAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingFake, setCreatingFake] = useState(false);
  const [syncingReal, setSyncingReal] = useState(false);

  async function loadPrimaryAccounts() {
    if (!workspaceId) return;

    try {
      const res = await fetch(
        `/api/network/primary/list?workspaceId=${workspaceId}`,
        {
          cache: "no-store",
        }
      );

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
      console.error("[supporters/interactions] erro ao carregar primárias:", error);
    }
  }

  async function loadSupporters() {
    if (!workspaceId || !selectedPrimaryId) {
      setSupporters([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/network/supporters/list?workspaceId=${workspaceId}&primaryAccountId=${selectedPrimaryId}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (data.ok) {
        setSupporters(data.supporters || []);
      }
    } catch (error) {
      console.error("[supporters/interactions] erro ao carregar apoiadores:", error);
    }
  }

  async function loadInteractions() {
    if (!workspaceId || !selectedPrimaryId) {
      setInteractions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const url =
        `/api/network/interactions/list?workspaceId=${workspaceId}` +
        `&primaryAccountId=${selectedPrimaryId}` +
        `&status=${statusFilter}`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (data.ok) {
        setInteractions(data.interactions || []);
      } else {
        setInteractions([]);
      }
    } catch (error) {
      console.error("[supporters/interactions] erro ao carregar interações:", error);
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrimaryAccounts();
  }, [workspaceId]);

  useEffect(() => {
    loadSupporters();
    loadInteractions();
  }, [workspaceId, selectedPrimaryId, statusFilter]);

  const selectedPrimary = useMemo(
    () => primaryAccounts.find((acc) => acc.id === selectedPrimaryId) || null,
    [primaryAccounts, selectedPrimaryId]
  );

  async function handleCreateFakeInteraction() {
    if (!workspaceId || !selectedPrimaryId) {
      alert("Selecione uma conta principal.");
      return;
    }

    const source = supporters[0];

    if (!source?.id) {
      alert("Crie ou conecte ao menos um apoiador para testar.");
      return;
    }

    try {
      setCreatingFake(true);

      const res = await fetch("/api/network/interactions/create-fake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          primaryAccountId: selectedPrimaryId,
          sourceCampaignAccountId: source.id,
          commenterUsername: "eleitor_teste",
          commenterText: "quero saber mais sobre a campanha",
          sourceRole: "supporter",
          sourceName: source.name,
          sourceUsername: source.username || "",
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao criar interação fake.");
      }

      await loadInteractions();
      alert("Interação fake criada.");
    } catch (error: any) {
      alert(error?.message || "Erro ao criar interação fake.");
    } finally {
      setCreatingFake(false);
    }
  }

  async function handleSyncRealComments() {
    if (!workspaceId) {
      alert("Workspace não encontrado.");
      return;
    }

    try {
      setSyncingReal(true);

      const res = await fetch("/api/instagram/comments/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao sincronizar comentários reais.");
      }

      await loadInteractions();

      alert(
        `Sincronização concluída. Novos: ${data.inserted ?? 0}, atualizados: ${data.updated ?? 0}`
      );
    } catch (error: any) {
      alert(error?.message || "Erro ao sincronizar comentários reais.");
    } finally {
      setSyncingReal(false);
    }
  }

  return (
    <section className="mt-4 flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-semibold text-white">
          Interações da rede
        </h1>
        <p className="text-xs text-[#9CA3AF]">
          Centralize comentários e transforme interações em leads.
        </p>
      </header>

      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-white">Conta principal</p>
          <p className="text-[11px] text-[#9CA3AF]">
            Escolha a campanha principal que deseja acompanhar.
          </p>
        </div>

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

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCreateFakeInteraction}
            disabled={creatingFake}
            className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-sm font-medium text-white px-4 py-2 disabled:opacity-60"
          >
            {creatingFake ? "Criando..." : "Criar interação fake para teste"}
          </button>

          <button
            type="button"
            onClick={handleSyncRealComments}
            disabled={syncingReal}
            className="rounded-xl border border-[#272046] text-sm font-medium text-white px-4 py-2 disabled:opacity-60"
          >
            {syncingReal ? "Sincronizando..." : "Sincronizar comentários reais"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-white">Filtros</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-[#272046] bg-[#020012] text-sm text-white px-3 py-2 outline-none"
        >
          <option value="all">Todos</option>
          <option value="new">Novos</option>
          <option value="read">Lidos</option>
          <option value="lead">Leads</option>
          <option value="replied">Respondidos</option>
          <option value="private_replied">Privado respondido</option>
          <option value="archived">Arquivados</option>
        </select>
      </div>

      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-white">Fila central</p>
          <p className="text-[11px] text-[#9CA3AF]">
            Comentários centralizados da conta principal e apoiadores.
          </p>
        </div>

        {loading ? (
          <p className="text-xs text-[#9CA3AF]">Carregando interações...</p>
        ) : interactions.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">
            Nenhuma interação encontrada para este filtro.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {interactions.map((interaction) => (
              <InteractionCard
                key={interaction.id}
                interaction={interaction}
                onRefresh={loadInteractions}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}