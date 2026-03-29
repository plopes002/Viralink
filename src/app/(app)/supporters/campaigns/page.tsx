// src/app/(app)/supporters/campaigns/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUser } from "@/firebase/provider";
import { CampaignCard } from "@/components/supporters/CampaignCard";

type PrimaryAccount = {
  id: string;
  name: string;
  username: string;
};

type Campaign = {
  id: string;
  title: string;
  description?: string;
  objective: string;
  status: string;
  createdAt?: string;
};

type Assignment = {
  id: string;
  status: string;
  supporterName: string;
  supporterUsername: string;
};

export default function SupporterCampaignsPage() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useUser();

  const workspaceId = currentWorkspace?.id ?? null;

  const [primaryAccounts, setPrimaryAccounts] = useState<PrimaryAccount[]>([]);
  const [selectedPrimaryId, setSelectedPrimaryId] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("reach");

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

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

  async function loadCampaigns() {
    if (!workspaceId || !selectedPrimaryId) {
      setCampaigns([]);
      return;
    }

    const res = await fetch(
      `/api/network/campaigns/list?workspaceId=${workspaceId}&primaryAccountId=${selectedPrimaryId}`,
      { cache: "no-store" }
    );
    const data = await res.json();

    if (data.ok) {
      setCampaigns(data.campaigns || []);
    }
  }

  async function loadAssignments(campaignId: string) {
    if (!campaignId) {
      setAssignments([]);
      return;
    }

    const res = await fetch(
      `/api/network/campaigns/assignments?campaignId=${campaignId}`,
      { cache: "no-store" }
    );
    const data = await res.json();

    if (data.ok) {
      setAssignments(data.assignments || []);
    }
  }

  useEffect(() => {
    loadPrimaryAccounts();
  }, [workspaceId]);

  useEffect(() => {
    loadCampaigns();
  }, [workspaceId, selectedPrimaryId]);

  useEffect(() => {
    loadAssignments(selectedCampaignId);
  }, [selectedCampaignId]);

  const selectedPrimary = useMemo(
    () => primaryAccounts.find((acc) => acc.id === selectedPrimaryId) || null,
    [primaryAccounts, selectedPrimaryId]
  );

  async function handleCreateCampaign() {
    if (!workspaceId || !selectedPrimaryId || !user?.uid || !title.trim()) {
      alert("Preencha os dados obrigatórios.");
      return;
    }

    try {
      setCreating(true);

      const res = await fetch("/api/network/campaigns/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          primaryAccountId: selectedPrimaryId,
          title: title.trim(),
          description: description.trim(),
          objective,
          createdByUserId: user.uid,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao criar campanha.");
      }

      setTitle("");
      setDescription("");
      setObjective("reach");
      await loadCampaigns();
    } catch (error: any) {
      alert(error?.message || "Erro ao criar campanha.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDistribute(campaignId: string) {
    if (!workspaceId || !selectedPrimaryId) return;

    try {
      setLoading(true);

      const res = await fetch("/api/network/campaigns/distribute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          primaryAccountId: selectedPrimaryId,
          campaignId,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao distribuir campanha.");
      }

      setSelectedCampaignId(campaignId);
      await loadAssignments(campaignId);
      alert(`Campanha distribuída para ${data.distributed} apoiador(es).`);
    } catch (error: any) {
      alert(error?.message || "Erro ao distribuir campanha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-4 flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-semibold text-white">Campanhas dos apoiadores</h1>
        <p className="text-xs text-[#9CA3AF]">
          Crie ações para sua rede apoiar alcance, seguidores, leads e engajamento.
        </p>
      </header>

      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-white">Conta principal</p>
          <p className="text-[11px] text-[#9CA3AF]">
            Escolha a conta principal da campanha.
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
      </div>

      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-white">Nova campanha</p>
          <p className="text-[11px] text-[#9CA3AF]">
            Crie uma campanha e depois distribua para os apoiadores ativos.
          </p>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da campanha"
          className="rounded-xl border border-[#272046] bg-[#020012] text-sm text-white px-3 py-2 outline-none"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva a ação que os apoiadores devem executar"
          rows={4}
          className="rounded-xl border border-[#272046] bg-[#020012] text-sm text-white px-3 py-2 outline-none"
        />

        <select
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="rounded-xl border border-[#272046] bg-[#020012] text-sm text-white px-3 py-2 outline-none"
        >
          <option value="reach">Alcance</option>
          <option value="followers">Seguidores</option>
          <option value="leads">Leads</option>
          <option value="engagement">Engajamento</option>
        </select>

        <button
          type="button"
          onClick={handleCreateCampaign}
          disabled={creating}
          className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-sm font-medium text-white px-4 py-2 disabled:opacity-60"
        >
          {creating ? "Criando..." : "Criar campanha"}
        </button>
      </div>

      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-white">Campanhas criadas</p>
          <p className="text-[11px] text-[#9CA3AF]">
            Distribua as campanhas para os apoiadores com permissão ativa.
          </p>
        </div>

        {campaigns.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">Nenhuma campanha criada ainda.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => setSelectedCampaignId(campaign.id)}
                className="cursor-pointer"
              >
                <CampaignCard
                  campaign={campaign}
                  onDistribute={handleDistribute}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-white">Distribuição</p>
          <p className="text-[11px] text-[#9CA3AF]">
            Veja quem recebeu a campanha selecionada.
          </p>
        </div>

        {loading ? (
          <p className="text-xs text-[#9CA3AF]">Processando...</p>
        ) : !selectedCampaignId ? (
          <p className="text-xs text-[#9CA3AF]">
            Selecione uma campanha para ver a distribuição.
          </p>
        ) : assignments.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">
            Nenhuma distribuição registrada ainda.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {assignments.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#272046] bg-[#0A0322] p-3"
              >
                <p className="text-sm font-medium text-white">
                  {item.supporterName}
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  {item.supporterUsername || "Sem username"}
                </p>
                <span className="mt-2 inline-flex px-3 py-1 rounded-full text-[10px] bg-violet-500/15 text-violet-300">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}