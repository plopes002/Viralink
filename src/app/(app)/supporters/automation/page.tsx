// src/app/(app)/supporters/automation/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { AutomationRuleCard } from "@/components/supporters/AutomationRuleCard";

type PrimaryAccount = {
  id: string;
  name: string;
  username: string;
};

type Rule = {
  id: string;
  name: string;
  triggerType: string;
  keywords?: string[];
  actions?: {
    autoReplyPublic?: boolean;
    autoReplyPrivate?: boolean;
    autoConvertToLead?: boolean;
  };
  replyTemplatePublic?: string | null;
  replyTemplatePrivate?: string | null;
  delaySeconds?: number;
  active: boolean;
};

export default function SupportersAutomationPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const [primaryAccounts, setPrimaryAccounts] = useState<PrimaryAccount[]>([]);
  const [selectedPrimaryId, setSelectedPrimaryId] = useState("");

  const [rules, setRules] = useState<Rule[]>([]);

  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("contains");
  const [keywords, setKeywords] = useState("");
  const [autoReplyPublic, setAutoReplyPublic] = useState(false);
  const [autoReplyPrivate, setAutoReplyPrivate] = useState(false);
  const [autoConvertToLead, setAutoConvertToLead] = useState(true);
  const [replyTemplatePublic, setReplyTemplatePublic] = useState("");
  const [replyTemplatePrivate, setReplyTemplatePrivate] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  async function loadRules() {
    if (!workspaceId || !selectedPrimaryId) {
      setRules([]);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/network/automation-rules/list?workspaceId=${workspaceId}&primaryAccountId=${selectedPrimaryId}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (data.ok) {
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error("[supporters/automation] erro:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrimaryAccounts();
  }, [workspaceId]);

  useEffect(() => {
    loadRules();
  }, [workspaceId, selectedPrimaryId]);

  const selectedPrimary = useMemo(
    () => primaryAccounts.find((acc) => acc.id === selectedPrimaryId) || null,
    [primaryAccounts, selectedPrimaryId]
  );

  async function handleCreateRule() {
    if (!workspaceId || !selectedPrimaryId || !name.trim()) {
      alert("Preencha os dados obrigatórios.");
      return;
    }

    try {
      setSaving(true);

      const parsedKeywords = keywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const res = await fetch("/api/network/automation-rules/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          primaryAccountId: selectedPrimaryId,
          name: name.trim(),
          keywords: parsedKeywords,
          triggerType,
          actions: {
            autoReplyPublic,
            autoReplyPrivate,
            autoConvertToLead,
          },
          replyTemplatePublic: replyTemplatePublic || null,
          replyTemplatePrivate: replyTemplatePrivate || null,
          delaySeconds: Number(delaySeconds) || 0,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao criar regra.");
      }

      setName("");
      setKeywords("");
      setTriggerType("contains");
      setAutoReplyPublic(false);
      setAutoReplyPrivate(false);
      setAutoConvertToLead(true);
      setReplyTemplatePublic("");
      setReplyTemplatePrivate("");
      setDelaySeconds(0);

      await loadRules();
    } catch (error: any) {
      alert(error?.message || "Erro ao criar regra.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-4 flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-semibold text-white">
          Automação da rede
        </h1>
        <p className="text-xs text-[#9CA3AF]">
          Crie regras automáticas para responder comentários e gerar leads.
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
        <div>
          <p className="text-sm font-medium text-white">Nova automação</p>
          <p className="text-[11px] text-[#9CA3AF]">
            Crie uma regra para responder automaticamente comentários da rede.
          </p>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da regra"
          className="rounded-xl border border-[#272046] bg-[#020012] text-sm text-white px-3 py-2 outline-none"
        />

        <select
          value={triggerType}
          onChange={(e) => setTriggerType(e.target.value)}
          className="rounded-xl border border-[#272046] bg-[#020012] text-sm text-white px-3 py-2 outline-none"
        >
          <option value="contains">Contém palavras</option>
          <option value="any">Qualquer comentário</option>
        </select>

        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Palavras-chave separadas por vírgula"
          className="rounded-xl border border-[#272046] bg-[#020012] text-sm text-white px-3 py-2 outline-none"
        />

        <textarea
          value={replyTemplatePublic}
          onChange={(e) => setReplyTemplatePublic(e.target.value)}
          placeholder="Mensagem de resposta pública"
          rows={3}
          className="rounded-xl border border-[#272046] bg-[#020012] text-sm text-white px-3 py-2 outline-none"
        />

        <textarea
          value={replyTemplatePrivate}
          onChange={(e) => setReplyTemplatePrivate(e.target.value)}
          placeholder="Mensagem de resposta privada"
          rows={3}
          className="rounded-xl border border-[#272046] bg-[#020012] text-sm text-white px-3 py-2 outline-none"
        />

        <input
          type="number"
          min={0}
          value={delaySeconds}
          onChange={(e) => setDelaySeconds(Number(e.target.value))}
          placeholder="Delay em segundos"
          className="rounded-xl border border-[#272046] bg-[#020012] text-sm text-white px-3 py-2 outline-none"
        />

        <div className="grid gap-2 text-sm text-white">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoReplyPublic}
              onChange={(e) => setAutoReplyPublic(e.target.checked)}
            />
            Responder publicamente
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoReplyPrivate}
              onChange={(e) => setAutoReplyPrivate(e.target.checked)}
            />
            Responder no privado
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoConvertToLead}
              onChange={(e) => setAutoConvertToLead(e.target.checked)}
            />
            Converter em lead
          </label>
        </div>

        <button
          type="button"
          onClick={handleCreateRule}
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-sm font-medium text-white px-4 py-2 disabled:opacity-60"
        >
          {saving ? "Criando..." : "Criar automação"}
        </button>
      </div>

      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-white">Regras criadas</p>
          <p className="text-[11px] text-[#9CA3AF]">
            Gerencie as automações da conta principal.
          </p>
        </div>

        {loading ? (
          <p className="text-xs text-[#9CA3AF]">Carregando regras...</p>
        ) : rules.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">
            Nenhuma regra criada ainda.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rules.map((rule) => (
              <AutomationRuleCard
                key={rule.id}
                rule={rule}
                onRefresh={loadRules}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}