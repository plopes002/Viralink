// src/app/(app)/automations/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useAutomations } from "@/hooks/useAutomations";
import type {
  AutomationChannel,
  SocialAccountAutomationRule,
  CompetitorLeadAutomationRule,
} from "@/types/automation";
import { createAutomation } from "@/firebase/automations";
import { useFirebase } from "@/firebase/provider";
import { addDoc, collection } from "firebase/firestore";

const TRIGGERS: { id: SocialAccountAutomationRule["trigger"]; label: string }[] = [
  { id: "new_follower", label: "Novo seguidor" },
  { id: "new_comment", label: "Novo comentário" },
  { id: "new_message", label: "Nova mensagem" },
  { id: "new_reaction", label: "Nova reação (curtida, etc.)" },
];

const CHANNELS: { id: AutomationChannel; label: string }[] = [
  { id: "instagram_dm", label: "Instagram Direct" },
  { id: "facebook_dm", label: "Facebook Messenger" },
  { id: "whatsapp", label: "WhatsApp" },
];

type InteractionAutomationRule = {
  id: string;
  name: string;
  keywords: string[];
  active: boolean;
  priority?: number;
  actions?: {
    markAsRead?: boolean;
    publicReply?: boolean;
    privateReply?: boolean;
    convertToLead?: boolean;
  };
  replyTemplatePublic?: string | null;
  replyTemplatePrivate?: string | null;
  publicReplyTemplate?: string | null;
  privateReplyTemplate?: string | null;
};

export default function AutomationsPage() {
  const { currentWorkspace } = useWorkspace();
  const { firestore } = useFirebase();
  const workspaceId = currentWorkspace?.id;

  const { accounts: socialAccounts } = useSocialAccounts(workspaceId);
  const { automations, loading } = useAutomations(workspaceId);

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // formulário automações sociais
  const [name, setName] = useState("");
  const [trigger, setTrigger] =
    useState<SocialAccountAutomationRule["trigger"]>("new_follower");
  const [network, setNetwork] = useState<"instagram" | "facebook" | "whatsapp">(
    "instagram"
  );
  const [socialAccountId, setSocialAccountId] = useState<string>("");
  const [actionChannel, setActionChannel] =
    useState<AutomationChannel>("instagram_dm");
  const [containsKeyword, setContainsKeyword] = useState("");
  const [messageTemplateId, setMessageTemplateId] =
    useState<string>("default_welcome");

  // seção nova: regras do motor de comentários
  const [interactionRules, setInteractionRules] = useState<
    InteractionAutomationRule[]
  >([]);
  const [loadingInteractionRules, setLoadingInteractionRules] = useState(true);

  const [metrics, setMetrics] = useState<any[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [creatingInteractionRule, setCreatingInteractionRule] = useState(false);

  const [ruleName, setRuleName] = useState("");
  const [ruleKeywords, setRuleKeywords] = useState("");
  const [rulePublicReply, setRulePublicReply] = useState("Te respondi no privado 😉");
  const [rulePrivateReply, setRulePrivateReply] = useState(
    "Olá! Vou te passar os detalhes aqui no privado."
  );
  const [ruleMarkAsRead, setRuleMarkAsRead] = useState(true);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [ruleReplyPublic, setRuleReplyPublic] = useState(true);
  const [ruleReplyPrivate, setRuleReplyPrivate] = useState(true);
  const [ruleConvertToLead, setRuleConvertToLead] = useState(true);

  
  const [metricsSummary, setMetricsSummary] = useState<any | null>(null);
  

  const handleOpenForm = () => {
    if (!workspaceId) {
      alert("Workspace não disponível.");
      return;
    }
    setShowForm(true);
  };

  const handleCreate = async () => {
    if (!workspaceId) {
      alert("Workspace não disponível.");
      return;
    }
    if (!name.trim()) {
      alert("Dê um nome para a automação.");
      return;
    }
    if (!socialAccountId) {
      alert("Selecione uma conta conectada.");
      return;
    }

    setCreating(true);
    try {
      await createAutomation(firestore, {
        workspaceId,
        name: name.trim(),
        active: true,
        trigger,
        network,
        socialAccountId,
        actionChannel,
        messageTemplateId,
        conditions: containsKeyword
          ? { containsKeyword }
          : undefined,
      } as any);

      setName("");
      setContainsKeyword("");
      setMessageTemplateId("default_welcome");
      setShowForm(false);
    } catch (err) {
      console.error("[AutomacoesPage] erro ao criar automação:", err);
      alert("Erro ao criar automação.");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCompetitorAutomation = async () => {
    if (!workspaceId || !firestore) return;

    try {
      await addDoc(collection(firestore, "automations"), {
        workspaceId,
        name: "Captura concorrente - engajados",
        trigger: "competitor_lead",
        conditions: {
          onlyNonFollowers: true,
          onlyEngaged: true,
        },
        action: {
          type: "send_message",
          message:
            "Queria te mostrar algo que pode te interessar bastante sobre esse tema.",
        },
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      alert("Automação de concorrente criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar automação de concorrente", error);
      alert("Falha ao criar automação.");
    }
  };

  async function loadInteractionRules() {
    if (!workspaceId) return;

    try {
      setLoadingInteractionRules(true);

      const primaryRes = await fetch(
        `/api/network/primary/list?workspaceId=${workspaceId}`,
        { cache: "no-store" }
      );
      const primaryData = await primaryRes.json();

      const primary =
        primaryData.accounts?.find((acc: any) => acc.role === "primary") ||
        primaryData.accounts?.[0];

      if (!primary?.id) {
        setInteractionRules([]);
        return;
      }

      const res = await fetch(
        `/api/network/automation-rules/list?workspaceId=${workspaceId}&primaryAccountId=${primary.id}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (data.ok) {
        setInteractionRules(data.rules || []);
      } else {
        setInteractionRules([]);
      }
    } catch (error) {
      console.error("[AutomationsPage] erro ao carregar regras de interação:", error);
      setInteractionRules([]);
    } finally {
      setLoadingInteractionRules(false);
    }
  }

  

  async function loadMetrics() {
    if (!workspaceId) return;

    try {
      setLoadingMetrics(true);

      const res = await fetch(
        `/api/network/automation-rules/metrics?workspaceId=${workspaceId}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (data.ok) {
        setMetrics(data.metrics || []);
        setMetricsSummary(data.summary || null);
      } else {
        setMetrics([]);
        setMetricsSummary(null);
      }
    } catch (err) {
      console.error("[AutomationsPage] erro ao carregar métricas:", err);
      setMetrics([]);
      setMetricsSummary(null);
    } finally {
      setLoadingMetrics(false);
    }
  }

  
  useEffect(() => {
    loadInteractionRules();
  }, [workspaceId]);

  useEffect(() => {
    loadMetrics();
  }, [workspaceId]);

  

  async function handleCreateInteractionRule() {
    if (!workspaceId) {
      alert("Workspace não disponível.");
      return;
    }

    if (!ruleName.trim()) {
      alert("Dê um nome para a regra.");
      return;
    }

    try {
      setCreatingInteractionRule(true);

      const primaryRes = await fetch(
        `/api/network/primary/list?workspaceId=${workspaceId}`,
        { cache: "no-store" }
      );
      const primaryData = await primaryRes.json();

      const primary =
        primaryData.accounts?.find((acc: any) => acc.role === "primary") ||
        primaryData.accounts?.[0];

      if (!primary?.id) {
        alert("Nenhuma conta principal encontrada.");
        return;
      }

      const res = await fetch("/api/network/automation-rules/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          primaryAccountId: primary.id,
          name: ruleName.trim(),
          keywords: ruleKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          actions: {
            markAsRead: ruleMarkAsRead,
            publicReply: ruleReplyPublic,
            privateReply: ruleReplyPrivate,
            convertToLead: ruleConvertToLead,
          },
          replyTemplatePublic: rulePublicReply,
          replyTemplatePrivate: rulePrivateReply,
          priority: 1,
          active: true,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao criar regra.");
      }

      setRuleName("");
      setRuleKeywords("");
      setRulePublicReply("Te respondi no privado 😉");
      setRulePrivateReply("Olá! Vou te passar os detalhes aqui no privado.");
      setRuleMarkAsRead(true);
      setRuleReplyPublic(true);
      setRuleReplyPrivate(true);
      setRuleConvertToLead(true);

      await loadInteractionRules();
      alert("Regra de automação criada com sucesso.");
    } catch (error: any) {
      console.error("[AutomationsPage] erro ao criar regra de interação:", error);
      alert(error?.message || "Erro ao criar regra.");
    } finally {
      setCreatingInteractionRule(false);
    }
  }

  async function toggleInteractionRule(rule: InteractionAutomationRule) {
    try {
      const res = await fetch("/api/network/automation-rules/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ruleId: rule.id,
          active: !rule.active,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao atualizar regra.");
      }

      await loadInteractionRules();
    } catch (error: any) {
      alert(error?.message || "Erro ao atualizar regra.");
    }
  }

  async function deleteInteractionRule(ruleId: string) {
    if (!confirm("Excluir regra de automação?")) return;

    try {
      const res = await fetch("/api/network/automation-rules/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ruleId }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao excluir regra.");
      }

      await loadInteractionRules();
    } catch (error: any) {
      alert(error?.message || "Erro ao excluir regra.");
    }
  }

  function handleEdit(rule: any) {
    setEditingRule(rule);
  
    setRuleName(rule.name || "");
    setRuleKeywords((rule.keywords || []).join(", "));
    setRulePublicReply(rule.replyTemplatePublic || "");
    setRulePrivateReply(rule.replyTemplatePrivate || "");
  
    setRuleMarkAsRead(rule.actions?.markAsRead ?? true);
    setRuleReplyPublic(rule.actions?.publicReply ?? true);
    setRuleReplyPrivate(rule.actions?.privateReply ?? true);
    setRuleConvertToLead(rule.actions?.convertToLead ?? true);
  }

  async function handleSaveRule() {
    if (!workspaceId) return;
  
    try {
      setCreatingInteractionRule(true);
  
      if (editingRule) {
        // 🔥 UPDATE
        const res = await fetch("/api/network/automation-rules/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ruleId: editingRule.id,
            name: ruleName,
            keywords: ruleKeywords.split(",").map((k) => k.trim()),
            actions: {
              markAsRead: ruleMarkAsRead,
              publicReply: ruleReplyPublic,
              privateReply: ruleReplyPrivate,
              convertToLead: ruleConvertToLead,
            },
            replyTemplatePublic: rulePublicReply,
            replyTemplatePrivate: rulePrivateReply,
          }),
        });
  
        const data = await res.json();
  
        if (!data.ok) throw new Error(data.error);
  
        alert("Regra atualizada.");
      } else {
        // CREATE (já existente)
        await handleCreateInteractionRule();
      }
  
      setEditingRule(null);
      await loadInteractionRules();
    } catch (error: any) {
      alert(error?.message || "Erro ao salvar.");
    } finally {
      setCreatingInteractionRule(false);
    }
  }

  const getNetworkLabel = (net: string) => {
    if (net === "instagram") return "Instagram";
    if (net === "facebook") return "Facebook";
    if (net === "whatsapp") return "WhatsApp";
    return net;
  };

  const getTriggerLabel = (t: SocialAccountAutomationRule["trigger"]) =>
    TRIGGERS.find((tr) => tr.id === t)?.label || t;

  const getChannelLabel = (c: AutomationChannel) =>
    CHANNELS.find((ch) => ch.id === c)?.label || c;

  const getAccountLabel = (id: string) => {
    const acc = socialAccounts.find((a) => a.id === id);
    if (!acc) return "Conta não encontrada";
    return acc.displayName || `${acc.network} (${acc.id})`;
  };

  return (
    <section className="mt-4 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Automações</h1>
          <p className="text-xs text-[#9CA3AF]">
            Crie fluxos automáticos para responder seguidores, leads e clientes nas redes conectadas.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCreateCompetitorAutomation}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[12px] font-medium text-white px-4 py-2 hover:opacity-90 transition"
          >
            Criar automação de concorrente
          </button>
          <button
            type="button"
            onClick={handleOpenForm}
            className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-[12px] font-medium text-white px-4 py-2 hover:opacity-90 transition"
          >
            Nova automação social
          </button>
        </div>
      </header>

      {/* Lista de automações sociais já existentes */}
      <div className="flex flex-col gap-2">
        {loading && (
          <p className="text-xs text-[#9CA3AF]">Carregando automações...</p>
        )}

        {!loading && automations.length === 0 && (
          <p className="text-xs text-[#9CA3AF]">
            Nenhuma automação criada ainda.
          </p>
        )}

        {!loading &&
          automations.map((a) => {
            if (a.trigger === "competitor_lead") {
              const rule = a as CompetitorLeadAutomationRule;
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-[#272046] bg-[#050016] px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex flex-col">
                    <span className="text-[12px] text-white font-medium">
                      {rule.name}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF]">
                      Disparo: Lead de Concorrente • Ação: {rule.action.type}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-3 py-1 rounded-full ${
                      a.active
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-zinc-500/15 text-zinc-300"
                    }`}
                  >
                    {a.active ? "Ativa" : "Pausada"}
                  </span>
                </div>
              );
            }

            const rule = a as SocialAccountAutomationRule;
            return (
              <div
                key={a.id}
                className="rounded-2xl border border-[#272046] bg-[#050016] px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex flex-col">
                  <span className="text-[12px] text-white font-medium">
                    {rule.name}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    Disparo: {getTriggerLabel(rule.trigger)} • Rede:{" "}
                    {getNetworkLabel(rule.network)} • Conta:{" "}
                    {getAccountLabel(rule.socialAccountId)}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    Ação: {getChannelLabel(rule.actionChannel)} • Template:{" "}
                    {rule.messageTemplateId}
                  </span>
                  {rule.conditions?.containsKeyword && (
                    <span className="text-[10px] text-[#9CA3AF]">
                      Condição: comentário/mensagem contendo{" "}
                      <span className="font-medium">
                        “{rule.conditions.containsKeyword}”
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] px-3 py-1 rounded-full ${
                      a.active
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-zinc-500/15 text-zinc-300"
                    }`}
                  >
                    {a.active ? "Ativa" : "Pausada"}
                  </span>

                  <button className="text-[11px] text-[#E5E7EB] hover:text-white">
                    Editar
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* NOVA SEÇÃO: motor de automação de comentários */}
      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Regras automáticas de comentários
          </h2>
          <p className="text-[11px] text-[#9CA3AF]">
            Configure o motor que responde comentários, envia privado e transforma interação em lead.
          </p>
        </div>

        


              <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-white">
          Performance das automações
        </h2>

        {loadingMetrics ? (
          <p className="text-xs text-[#9CA3AF]">Carregando métricas...</p>
        ) : metrics.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">
            Nenhuma métrica disponível ainda.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {metrics.map((m) => (
              <div
                key={m.ruleId}
                className="bg-[#0A0322] border border-[#272046] rounded-xl p-4 flex flex-col gap-2"
              >
                <p className="text-white font-medium text-sm">
                  {m.ruleName}
                </p>

                <div className="text-xs text-[#9CA3AF]">
                  Execuções: {m.executions}
                </div>

                <div className="text-xs text-[#9CA3AF]">
                  Respostas públicas: {m.publicReplies}
                </div>

                <div className="text-xs text-[#9CA3AF]">
                  DMs: {m.privateReplies}
                </div>

                <div className="text-xs text-[#9CA3AF]">
                  Leads: {m.leads}
                </div>

                <div className="text-xs font-medium text-emerald-400">
                  Conversão: {(m.conversionRate * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



        <div className="grid gap-3">
          <input
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="Nome da regra"
            className="bg-[#020012] border border-[#272046] px-3 py-2 rounded text-white text-sm"
          />

          <input
            value={ruleKeywords}
            onChange={(e) => setRuleKeywords(e.target.value)}
            placeholder="Palavras-chave (separadas por vírgula)"
            className="bg-[#020012] border border-[#272046] px-3 py-2 rounded text-white text-sm"
          />

          <textarea
            value={rulePublicReply}
            onChange={(e) => setRulePublicReply(e.target.value)}
            placeholder="Mensagem pública automática"
            className="bg-[#020012] border border-[#272046] px-3 py-2 rounded text-white text-sm min-h-[80px]"
          />

          <textarea
            value={rulePrivateReply}
            onChange={(e) => setRulePrivateReply(e.target.value)}
            placeholder="Mensagem privada automática"
            className="bg-[#020012] border border-[#272046] px-3 py-2 rounded text-white text-sm min-h-[100px]"
          />

          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex items-center gap-2 text-xs text-white">
              <input
                type="checkbox"
                checked={ruleMarkAsRead}
                onChange={(e) => setRuleMarkAsRead(e.target.checked)}
              />
              Marcar como lido
            </label>

            <label className="flex items-center gap-2 text-xs text-white">
              <input
                type="checkbox"
                checked={ruleReplyPublic}
                onChange={(e) => setRuleReplyPublic(e.target.checked)}
              />
              Resposta pública
            </label>

            <label className="flex items-center gap-2 text-xs text-white">
              <input
                type="checkbox"
                checked={ruleReplyPrivate}
                onChange={(e) => setRuleReplyPrivate(e.target.checked)}
              />
              Resposta privada
            </label>

            <label className="flex items-center gap-2 text-xs text-white">
              <input
                type="checkbox"
                checked={ruleConvertToLead}
                onChange={(e) => setRuleConvertToLead(e.target.checked)}
              />
              Converter em lead
            </label>
          </div>

          <button
            type="button"
            disabled={creatingInteractionRule}
            onClick={handleSaveRule}
            className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
            {editingRule ? "Salvar alterações" : "Criar regra automática"}
          </button>
        </div>

        <div className="grid gap-3">
          {loadingInteractionRules ? (
            <p className="text-xs text-[#9CA3AF]">Carregando regras do motor...</p>
          ) : interactionRules.length === 0 ? (
            <p className="text-xs text-[#9CA3AF]">
              Nenhuma regra automática criada ainda.
            </p>
          ) : (
            interactionRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-[#0A0322] border border-[#272046] rounded-xl p-4 flex flex-col gap-2"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-white font-medium">{rule.name}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      Keywords: {rule.keywords?.join(", ") || "Sem keywords"}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      rule.active
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {rule.active ? "Ativo" : "Desativado"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-[10px]">
                  {rule.actions?.markAsRead && (
                    <span className="px-2 py-1 rounded-full bg-[#111827] text-white">
                      Marcar como lido
                    </span>
                  )}
                  {rule.actions?.publicReply && (
                    <span className="px-2 py-1 rounded-full bg-[#111827] text-white">
                      Resposta pública
                    </span>
                  )}
                  {rule.actions?.privateReply && (
                    <span className="px-2 py-1 rounded-full bg-[#111827] text-white">
                      Resposta privada
                    </span>
                  )}
                  {rule.actions?.convertToLead && (
                    <span className="px-2 py-1 rounded-full bg-[#111827] text-white">
                      Converter em lead
                    </span>
                  )}
                </div>

                {(rule.replyTemplatePublic ||
                  rule.publicReplyTemplate ||
                  rule.replyTemplatePrivate ||
                  rule.privateReplyTemplate) && (
                  <div className="grid gap-2 mt-1">
                    {(rule.replyTemplatePublic || rule.publicReplyTemplate) && (
                      <div className="rounded-lg border border-[#1F173B] bg-[#050016] p-2">
                        <p className="text-[10px] text-[#9CA3AF] mb-1">
                          Resposta pública
                        </p>
                        <p className="text-[11px] text-white">
                          {rule.replyTemplatePublic || rule.publicReplyTemplate}
                        </p>
                      </div>
                    )}

                    {(rule.replyTemplatePrivate || rule.privateReplyTemplate) && (
                      <div className="rounded-lg border border-[#1F173B] bg-[#050016] p-2">
                        <p className="text-[10px] text-[#9CA3AF] mb-1">
                          Resposta privada
                        </p>
                        <p className="text-[11px] text-white">
                          {rule.replyTemplatePrivate || rule.privateReplyTemplate}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => toggleInteractionRule(rule)}
                    className="text-xs px-3 py-1 border border-[#272046] rounded text-white"
                  >
                    {rule.active ? "Desativar" : "Ativar"}
                  </button>

                  <button
                    onClick={() => deleteInteractionRule(rule.id)}
                    className="text-xs px-3 py-1 border border-red-500 rounded text-red-300"
                  >
                    Excluir
                  </button>

                  <button
                    onClick={() => handleEdit(rule)}
                    className="text-xs px-3 py-1 border border-[#272046] rounded text-white"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>


      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-sm font-semibold text-white">
        Painel comercial das automações
      </h2>
      <p className="text-[11px] text-[#9CA3AF]">
        Veja quais regras estão gerando mais respostas e mais leads.
      </p>
    </div>
  </div>

  {loadingMetrics ? (
    <p className="text-xs text-[#9CA3AF]">Carregando métricas...</p>
  ) : !metricsSummary ? (
    <p className="text-xs text-[#9CA3AF]">
      Nenhuma métrica disponível ainda.
    </p>
  ) : (
    <>
      {/* Cards-resumo */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Execuções</p>
          <p className="text-lg font-semibold text-white">
            {metricsSummary.totalExecutions}
          </p>
        </div>

        <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Respostas públicas</p>
          <p className="text-lg font-semibold text-white">
            {metricsSummary.totalPublicReplies}
          </p>
        </div>

        <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Respostas privadas</p>
          <p className="text-lg font-semibold text-white">
            {metricsSummary.totalPrivateReplies}
          </p>
        </div>

        <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Leads</p>
          <p className="text-lg font-semibold text-white">
            {metricsSummary.totalLeads}
          </p>
        </div>

        <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Conversão média</p>
          <p className="text-lg font-semibold text-emerald-400">
            {(metricsSummary.averageConversionRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Destaques */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4">
          <p className="text-[11px] text-[#9CA3AF] mb-2">Melhor regra por leads</p>
          {metricsSummary.bestRuleByLeads ? (
            <>
              <p className="text-sm font-medium text-white">
                {metricsSummary.bestRuleByLeads.ruleName}
              </p>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Leads: {metricsSummary.bestRuleByLeads.leads} • Conversão:{" "}
                {(metricsSummary.bestRuleByLeads.conversionRate * 100).toFixed(1)}%
              </p>
            </>
          ) : (
            <p className="text-xs text-[#9CA3AF]">Sem dados ainda.</p>
          )}
        </div>

        <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4">
          <p className="text-[11px] text-[#9CA3AF] mb-2">Melhor regra por conversão</p>
          {metricsSummary.bestRuleByConversion ? (
            <>
              <p className="text-sm font-medium text-white">
                {metricsSummary.bestRuleByConversion.ruleName}
              </p>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Conversão:{" "}
                {(metricsSummary.bestRuleByConversion.conversionRate * 100).toFixed(1)}% •
                Leads: {metricsSummary.bestRuleByConversion.leads}
              </p>
            </>
          ) : (
            <p className="text-xs text-[#9CA3AF]">Sem dados ainda.</p>
          )}
        </div>
      </div>

      {/* Ranking + gráfico */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-white">Ranking de regras</p>

          {metrics.length === 0 ? (
            <p className="text-xs text-[#9CA3AF]">Sem métricas para ranking.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {metrics.map((m, index) => (
                <div
                  key={m.ruleId}
                  className="flex items-center justify-between rounded-lg border border-[#1F173B] bg-[#050016] px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-white">
                      #{index + 1} {m.ruleName}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      Execuções: {m.executions} • Leads: {m.leads}
                    </p>
                  </div>

                  <span className="text-xs font-medium text-emerald-400">
                    {(m.conversionRate * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-white">Leads por regra</p>

          {metrics.length === 0 ? (
            <p className="text-xs text-[#9CA3AF]">Sem dados para gráfico.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {metrics.map((m) => {
                const maxLeads = Math.max(...metrics.map((item) => item.leads || 0), 1);
                const width = ((m.leads || 0) / maxLeads) * 100;

                return (
                  <div key={m.ruleId} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white">{m.ruleName}</span>
                      <span className="text-[#9CA3AF]">{m.leads} leads</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#111827] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )}
</div>




      {/* Form de criação simples das automações sociais antigas */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="w-full max-w-lg rounded-2xl border border-[#272046] bg-[#020012] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-white">
                Nova automação social
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-[11px] text-[#9CA3AF] hover:text-white"
              >
                Fechar
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-[#E5E7EB] mb-1">
                Nome da automação
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#272046] bg-[#050016] text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                placeholder="Ex.: Boas-vindas no Instagram"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Disparo
                </label>
                <select
                  value={trigger}
                  onChange={(e) =>
                    setTrigger(e.target.value as SocialAccountAutomationRule["trigger"])
                  }
                  className="w-full rounded-xl border border-[#272046] bg-[#050016] text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                >
                  {TRIGGERS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Rede
                </label>
                <select
                  value={network}
                  onChange={(e) =>
                    setNetwork(
                      e.target.value as "instagram" | "facebook" | "whatsapp"
                    )
                  }
                  className="w-full rounded-xl border border-[#272046] bg-[#050016] text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#E5E7EB] mb-1">
                Conta conectada
              </label>
              <select
                value={socialAccountId}
                onChange={(e) => setSocialAccountId(e.target.value)}
                className="w-full rounded-xl border border-[#272046] bg-[#050016] text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
              >
                <option value="">Selecione uma conta</option>
                {socialAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {getNetworkLabel(acc.network)} – {acc.displayName}
                  </option>
                ))}
              </select>
              {socialAccounts.length === 0 && (
                <p className="mt-1 text-[10px] text-rose-400">
                  Nenhuma conta conectada. Vá em “Contas conectadas” para
                  vincular suas redes antes de criar automações.
                </p>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Canal de envio
                </label>
                <select
                  value={actionChannel}
                  onChange={(e) =>
                    setActionChannel(e.target.value as AutomationChannel)
                  }
                  className="w-full rounded-xl border border-[#272046] bg-[#050016] text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                >
                  {CHANNELS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Condição (palavra-chave opcional)
                </label>
                <input
                  value={containsKeyword}
                  onChange={(e) => setContainsKeyword(e.target.value)}
                  className="w-full rounded-xl border border-[#272046] bg-[#050016] text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  placeholder='Ex.: "preço", "valor", "promoção"...'
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#E5E7EB] mb-1">
                Template de mensagem (ID)
              </label>
              <input
                value={messageTemplateId}
                onChange={(e) => setMessageTemplateId(e.target.value)}
                className="w-full rounded-xl border border-[#272046] bg-[#050016] text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                placeholder="Ex.: welcome_default, promo_lead_whatsapp..."
              />
              <p className="mt-1 text-[10px] text-[#9CA3AF]">
                Depois podemos criar uma tela própria de templates para não
                precisar digitar o ID manualmente.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded-xl border border-[#272046] text-[12px] text-[#E5E7EB]/80 hover:bg-[#111827]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={handleCreate}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {creating ? "Criando..." : "Criar automação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}