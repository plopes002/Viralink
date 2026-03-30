// src/app/(app)/automations/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
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

type NetworkType = "instagram" | "facebook" | "whatsapp";

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

type AutomationMetric = {
  ruleId: string;
  ruleName: string;
  executions: number;
  publicReplies: number;
  privateReplies: number;
  leads: number;
  conversionRate: number;
};

type MetricsSummary = {
  totalExecutions: number;
  totalPublicReplies: number;
  totalPrivateReplies: number;
  totalLeads: number;
  averageConversionRate: number;
  bestRuleByLeads?: {
    ruleName: string;
    leads: number;
    conversionRate: number;
  } | null;
  bestRuleByConversion?: {
    ruleName: string;
    leads: number;
    conversionRate: number;
  } | null;
};

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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AutomationsPage() {
  const { currentWorkspace } = useWorkspace();
  const { firestore } = useFirebase();
  const workspaceId = currentWorkspace?.id;

  const { accounts: socialAccounts } = useSocialAccounts(workspaceId);
  const { automations, loading } = useAutomations(workspaceId);
  const [createAlsoOnFacebook, setCreateAlsoOnFacebook] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [trigger, setTrigger] =
    useState<SocialAccountAutomationRule["trigger"]>("new_follower");
  const [network, setNetwork] = useState<NetworkType>("instagram");
  const [socialAccountId, setSocialAccountId] = useState<string>("");
  const [actionChannel, setActionChannel] =
    useState<AutomationChannel>("instagram_dm");
  const [containsKeyword, setContainsKeyword] = useState("");
  const [messageTemplateId, setMessageTemplateId] =
    useState<string>("default_welcome");

  const [interactionRules, setInteractionRules] = useState<
    InteractionAutomationRule[]
  >([]);
  const [loadingInteractionRules, setLoadingInteractionRules] = useState(true);

  const [metrics, setMetrics] = useState<AutomationMetric[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [metricsSummary, setMetricsSummary] = useState<MetricsSummary | null>(
    null
  );

  const [creatingInteractionRule, setCreatingInteractionRule] = useState(false);
  const [editingRule, setEditingRule] =
    useState<InteractionAutomationRule | null>(null);

  const [ruleName, setRuleName] = useState("");
  const [ruleKeywords, setRuleKeywords] = useState("");
  const [rulePublicReply, setRulePublicReply] = useState(
    "Te respondi no privado 😉"
  );
  const [rulePrivateReply, setRulePrivateReply] = useState(
    "Olá! Vou te passar os detalhes aqui no privado."
  );
  const [ruleMarkAsRead, setRuleMarkAsRead] = useState(true);
  const [ruleReplyPublic, setRuleReplyPublic] = useState(true);
  const [ruleReplyPrivate, setRuleReplyPrivate] = useState(true);
  const [ruleConvertToLead, setRuleConvertToLead] = useState(true);
  const normalizeNetwork = (
    value: string | null | undefined
  ): NetworkType | "" => {
    const v = String(value || "").toLowerCase().trim();
  
    if (
      v === "instagram" ||
      v.includes("instagram") ||
      v === "instagram_dm" ||
      v === "ig"
    ) {
      return "instagram";
    }
  
    if (
      v === "facebook" ||
      v.includes("facebook") ||
      v.includes("messenger") ||
      v === "facebook_dm" ||
      v.includes("page")
    ) {
      return "facebook";
    }
  
    if (
      v === "whatsapp" ||
      v.includes("whatsapp") ||
      v === "wa" ||
      v === "wpp"
    ) {
      return "whatsapp";
    }
  
    return "";
  };
  
  
  
  const filteredSocialAccounts = useMemo(() => {
    return socialAccounts.filter(
      (acc) => normalizeNetwork(acc.network) === network
    );
  }, [socialAccounts, network]);

  useEffect(() => {
    if (!socialAccountId) return;
    const stillExists = filteredSocialAccounts.some((acc) => acc.id === socialAccountId);
    if (!stillExists) {
      setSocialAccountId("");
    }
  }, [filteredSocialAccounts, socialAccountId]);

  useEffect(() => {
    if (network === "instagram") setActionChannel("instagram_dm");
    if (network === "facebook") setActionChannel("facebook_dm");
    if (network === "whatsapp") setActionChannel("whatsapp");
  }, [network]);

  const maxLeads = useMemo(
    () => Math.max(...metrics.map((item) => item.leads || 0), 1),
    [metrics]
  );

  const handleOpenForm = () => {
    if (!workspaceId) {
      alert("Workspace não disponível.");
      return;
    }
    setShowForm(true);
  };

  const resetSocialForm = () => {
    setName("");
    setTrigger("new_follower");
    setNetwork("instagram");
    setSocialAccountId("");
    setActionChannel("instagram_dm");
    setContainsKeyword("");
    setMessageTemplateId("default_welcome");
    setCreateAlsoOnFacebook(false);
  };

  const resetInteractionForm = () => {
    setEditingRule(null);
    setRuleName("");
    setRuleKeywords("");
    setRulePublicReply("Te respondi no privado 😉");
    setRulePrivateReply("Olá! Vou te passar os detalhes aqui no privado.");
    setRuleMarkAsRead(true);
    setRuleReplyPublic(true);
    setRuleReplyPrivate(true);
    setRuleConvertToLead(true);
  };

  const handleCreate = async () => {
    if (!workspaceId || !firestore) {
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
  
    const selectedAccount = socialAccounts.find((acc) => acc.id === socialAccountId);
  
    if (!selectedAccount) {
      alert("Conta conectada não encontrada.");
      return;
    }
  
    setCreating(true);
  
    try {
      const normalizedSelectedNetwork = normalizeNetwork(selectedAccount.network);
      const now = new Date().toISOString();
  
      const automationsToCreate: Array<{
        network: NetworkType;
        socialAccountId: string;
        actionChannel: AutomationChannel;
        suffix?: string;
      }> = [];
  
      automationsToCreate.push({
        network: normalizedSelectedNetwork || network,
        socialAccountId: selectedAccount.id,
        actionChannel:
          normalizedSelectedNetwork === "facebook"
            ? "facebook_dm"
            : normalizedSelectedNetwork === "whatsapp"
            ? "whatsapp"
            : "instagram_dm",
      });
  
      if (createAlsoOnFacebook && normalizedSelectedNetwork === "instagram") {
        const facebookAccount = socialAccounts.find((acc) => {
          return normalizeNetwork(acc.network) === "facebook";
        });
  
        if (facebookAccount) {
          automationsToCreate.push({
            network: "facebook",
            socialAccountId: facebookAccount.id,
            actionChannel: "facebook_dm",
            suffix: "Facebook",
          });
        }
      }
  
      for (const item of automationsToCreate) {
        await addDoc(collection(firestore, "automations"), {
          workspaceId,
          name: item.suffix ? `${name.trim()} - ${item.suffix}` : name.trim(),
          type: "social",
          active: true,
          trigger,
          network: item.network,
          socialAccountId: item.socialAccountId,
          actionChannel: item.actionChannel,
          messageTemplateId: messageTemplateId.trim() || "default_welcome",
          conditions: containsKeyword?.trim()
            ? { containsKeyword: containsKeyword.trim() }
            : undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
  
      resetSocialForm();
      setCreateAlsoOnFacebook(false);
      setShowForm(false);
      alert("Automação social criada com sucesso!");
    } catch (err) {
      console.error("[AutomationsPage] erro ao criar automação:", err);
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

  async function getPrimaryAccountId() {
    if (!workspaceId) return null;

    const primaryRes = await fetch(
      `/api/network/primary/list?workspaceId=${workspaceId}`,
      { cache: "no-store" }
    );
    const primaryData = await primaryRes.json();

    const primary =
      primaryData.accounts?.find((acc: { role?: string }) => acc.role === "primary") ||
      primaryData.accounts?.[0];

    return primary?.id || null;
  }

  async function loadInteractionRules() {
    if (!workspaceId) {
      setInteractionRules([]);
      setLoadingInteractionRules(false);
      return;
    }

    try {
      setLoadingInteractionRules(true);

      const primaryAccountId = await getPrimaryAccountId();
      if (!primaryAccountId) {
        setInteractionRules([]);
        return;
      }

      const res = await fetch(
        `/api/network/automation-rules/list?workspaceId=${workspaceId}&primaryAccountId=${primaryAccountId}`,
        { cache: "no-store" }
      );

      const data = await res.json();
      setInteractionRules(data.ok ? data.rules || [] : []);
    } catch (error) {
      console.error("[AutomationsPage] erro ao carregar regras de interação:", error);
      setInteractionRules([]);
    } finally {
      setLoadingInteractionRules(false);
    }
  }

  async function loadMetrics() {
    if (!workspaceId) {
      setMetrics([]);
      setMetricsSummary(null);
      setLoadingMetrics(false);
      return;
    }

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
    loadMetrics();
  }, [workspaceId]);

  async function createInteractionRule() {
    if (!workspaceId) {
      alert("Workspace não disponível.");
      return false;
    }

    if (!ruleName.trim()) {
      alert("Dê um nome para a regra.");
      return false;
    }

    const primaryAccountId = await getPrimaryAccountId();
    if (!primaryAccountId) {
      alert("Nenhuma conta principal encontrada.");
      return false;
    }

    const res = await fetch("/api/network/automation-rules/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId,
        primaryAccountId,
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

    return true;
  }

  async function updateInteractionRule() {
    if (!editingRule) return false;

    const res = await fetch("/api/network/automation-rules/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ruleId: editingRule.id,
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
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error || "Erro ao atualizar regra.");
    }

    return true;
  }

  async function handleSaveRule() {
    if (!workspaceId) return;

    try {
      setCreatingInteractionRule(true);

      if (editingRule) {
        await updateInteractionRule();
        alert("Regra atualizada.");
      } else {
        await createInteractionRule();
        alert("Regra de automação criada com sucesso.");
      }

      resetInteractionForm();
      await Promise.all([loadInteractionRules(), loadMetrics()]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao salvar.";
      console.error("[AutomationsPage] erro ao salvar regra:", error);
      alert(message);
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

      await Promise.all([loadInteractionRules(), loadMetrics()]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar regra.";
      alert(message);
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

      if (editingRule?.id === ruleId) {
        resetInteractionForm();
      }

      await Promise.all([loadInteractionRules(), loadMetrics()]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao excluir regra.";
      alert(message);
    }
  }

  function handleEdit(rule: InteractionAutomationRule) {
    setEditingRule(rule);
    setRuleName(rule.name || "");
    setRuleKeywords((rule.keywords || []).join(", "));
    setRulePublicReply(rule.replyTemplatePublic || rule.publicReplyTemplate || "");
    setRulePrivateReply(
      rule.replyTemplatePrivate || rule.privateReplyTemplate || ""
    );
    setRuleMarkAsRead(rule.actions?.markAsRead ?? true);
    setRuleReplyPublic(rule.actions?.publicReply ?? true);
    setRuleReplyPrivate(rule.actions?.privateReply ?? true);
    setRuleConvertToLead(rule.actions?.convertToLead ?? true);
  }

  const getNetworkLabel = (net: string) => {
    const normalized = normalizeNetwork(net);
  
    if (normalized === "instagram") return "Instagram";
    if (normalized === "facebook") return "Facebook";
    if (normalized === "whatsapp") return "WhatsApp";
    return net;
  };

  const getTriggerLabel = (t: SocialAccountAutomationRule["trigger"]) =>
    TRIGGERS.find((tr) => tr.id === t)?.label || t;

  const getChannelLabel = (c: AutomationChannel) =>
    CHANNELS.find((ch) => ch.id === c)?.label || c;

  const getAccountLabel = (id: string) => {
    const acc = socialAccounts.find((a) => a.id === id);
    if (!acc) return "Conta não encontrada";
  
    return (
      acc.displayName ||
      (acc as any).username ||
      (acc as any).name ||
      (acc as any).pageName ||
      (acc as any).accountName ||
      `${getNetworkLabel(normalizeNetwork(acc.network))} (${acc.id})`
    );
  };

  return (
    <section className="mt-4 flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-[#272046] bg-[linear-gradient(135deg,rgba(12,7,36,0.96),rgba(4,1,20,0.98))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)] lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 inline-flex items-center rounded-full border border-[#31265e] bg-[#0D0828] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#A78BFA]">
            Central de automações
          </div>
          <h1 className="text-lg font-semibold text-white md:text-xl">
            Automações sociais, motor de comentários e painel comercial
          </h1>
          <p className="mt-1 text-xs text-[#9CA3AF] md:text-sm">
            Crie suas automações, gerencie, edite e exclua.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleCreateCompetitorAutomation}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-[12px] font-medium text-white transition hover:opacity-90"
          >
            Criar automação de concorrente
          </button>
          <button
            type="button"
            onClick={handleOpenForm}
            className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-2 text-[12px] font-medium text-white transition hover:opacity-90"
          >
            Nova automação social
          </button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Automações sociais já criadas
                </h2>
                <p className="text-[11px] text-[#9CA3AF]">
                  Fluxos para Instagram, Facebook e WhatsApp com conta conectada,
                  disparo e template.
                </p>
              </div>
              <div className="rounded-full border border-[#2d2353] bg-[#0A0322] px-3 py-1 text-[10px] text-[#C4B5FD]">
                {automations.length} automação(ões)
              </div>
            </div>

            <div className="flex flex-col gap-3">
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
                        className="rounded-2xl border border-[#272046] bg-[#0A0322] px-4 py-3"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-medium text-white">
                              {rule.name}
                            </span>
                            <span className="text-[10px] text-[#9CA3AF]">
                              Disparo: Lead de Concorrente • Ação: {rule.action.type}
                            </span>
                          </div>
                          <span
                            className={cx(
                              "w-fit rounded-full px-3 py-1 text-[10px]",
                              a.active
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-zinc-500/15 text-zinc-300"
                            )}
                          >
                            {a.active ? "Ativa" : "Pausada"}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const rule = a as SocialAccountAutomationRule;
                  return (
                    <div
                      key={a.id}
                      className="rounded-2xl border border-[#272046] bg-[#0A0322] px-4 py-3"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="text-[12px] font-medium text-white">
                            {rule.name}
                          </span>
                          <span className="text-[10px] text-[#9CA3AF]">
                            Disparo: {getTriggerLabel(rule.trigger)} • Rede:{" "}
                            {getNetworkLabel(rule.network)} • Conta:{" "}
                            {getAccountLabel(rule.socialAccountId)}
                          </span>
                          <span className="text-[10px] text-[#9CA3AF]">
                            Ação: {getChannelLabel(rule.actionChannel)} • Template:{" "}
                            {rule.messageTemplateId || rule.action?.messageTemplateId || "default_welcome"}
                          </span>
                          {rule.conditions?.containsKeyword && (
                            <span className="text-[10px] text-[#9CA3AF]">
                              Condição: comentário/mensagem contendo{" "}
                              <span className="font-medium text-white">
                                “{rule.conditions.containsKeyword}”
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={cx(
                              "rounded-full px-3 py-1 text-[10px]",
                              a.active
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-zinc-500/15 text-zinc-300"
                            )}
                          >
                            {a.active ? "Ativa" : "Pausada"}
                          </span>

                          <button className="text-[11px] text-[#E5E7EB] transition hover:text-white">
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-white">
                Regras automáticas de comentários
              </h2>
              <p className="text-[11px] text-[#9CA3AF]">
                Configure o motor que responde comentários, envia DM, marca como
                lido e transforma interação em lead.
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-2xl border border-[#272046] bg-[#0A0322] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      {editingRule ? "Editar regra" : "Nova regra automática"}
                    </h3>
                    <p className="text-[11px] text-[#9CA3AF]">
                      Use palavras-chave e defina as ações automáticas.
                    </p>
                  </div>

                  {editingRule && (
                    <button
                      type="button"
                      onClick={resetInteractionForm}
                      className="rounded-lg border border-[#2b2250] px-3 py-1 text-[11px] text-[#E5E7EB] hover:bg-[#111827]"
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>

                <div className="grid gap-3">
                  <input
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="Nome da regra"
                    className="rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />

                  <input
                    value={ruleKeywords}
                    onChange={(e) => setRuleKeywords(e.target.value)}
                    placeholder="Palavras-chave (separadas por vírgula)"
                    className="rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />

                  <textarea
                    value={rulePublicReply}
                    onChange={(e) => setRulePublicReply(e.target.value)}
                    placeholder="Mensagem pública automática"
                    className="min-h-[90px] rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />

                  <textarea
                    value={rulePrivateReply}
                    onChange={(e) => setRulePrivateReply(e.target.value)}
                    placeholder="Mensagem privada automática"
                    className="min-h-[110px] rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />

                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="flex items-center gap-2 rounded-xl border border-[#20173c] bg-[#050016] px-3 py-2 text-xs text-white">
                      <input
                        type="checkbox"
                        checked={ruleMarkAsRead}
                        onChange={(e) => setRuleMarkAsRead(e.target.checked)}
                      />
                      Marcar como lido
                    </label>

                    <label className="flex items-center gap-2 rounded-xl border border-[#20173c] bg-[#050016] px-3 py-2 text-xs text-white">
                      <input
                        type="checkbox"
                        checked={ruleReplyPublic}
                        onChange={(e) => setRuleReplyPublic(e.target.checked)}
                      />
                      Resposta pública
                    </label>

                    <label className="flex items-center gap-2 rounded-xl border border-[#20173c] bg-[#050016] px-3 py-2 text-xs text-white">
                      <input
                        type="checkbox"
                        checked={ruleReplyPrivate}
                        onChange={(e) => setRuleReplyPrivate(e.target.checked)}
                      />
                      Resposta privada
                    </label>

                    <label className="flex items-center gap-2 rounded-xl border border-[#20173c] bg-[#050016] px-3 py-2 text-xs text-white">
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
                    {creatingInteractionRule
                      ? "Salvando..."
                      : editingRule
                      ? "Salvar alterações"
                      : "Criar regra automática"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#272046] bg-[#0A0322] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Regras cadastradas
                    </h3>
                    <p className="text-[11px] text-[#9CA3AF]">
                      Ative, desative, edite e exclua suas regras do motor.
                    </p>
                  </div>
                  <div className="rounded-full border border-[#2b2250] bg-[#050016] px-3 py-1 text-[10px] text-[#C4B5FD]">
                    {interactionRules.length} regra(s)
                  </div>
                </div>

                <div className="grid gap-3">
                  {loadingInteractionRules ? (
                    <p className="text-xs text-[#9CA3AF]">
                      Carregando regras do motor...
                    </p>
                  ) : interactionRules.length === 0 ? (
                    <p className="text-xs text-[#9CA3AF]">
                      Nenhuma regra automática criada ainda.
                    </p>
                  ) : (
                    interactionRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="rounded-xl border border-[#272046] bg-[#050016] p-4"
                      >
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">{rule.name}</p>
                            <p className="mt-1 text-xs text-[#9CA3AF]">
                              Keywords: {rule.keywords?.join(", ") || "Sem keywords"}
                            </p>
                          </div>

                          <span
                            className={cx(
                              "h-fit rounded-full px-2 py-1 text-xs",
                              rule.active
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-red-500/20 text-red-300"
                            )}
                          >
                            {rule.active ? "Ativo" : "Desativado"}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                          {rule.actions?.markAsRead && (
                            <span className="rounded-full bg-[#111827] px-2 py-1 text-white">
                              Marcar como lido
                            </span>
                          )}
                          {rule.actions?.publicReply && (
                            <span className="rounded-full bg-[#111827] px-2 py-1 text-white">
                              Resposta pública
                            </span>
                          )}
                          {rule.actions?.privateReply && (
                            <span className="rounded-full bg-[#111827] px-2 py-1 text-white">
                              Resposta privada
                            </span>
                          )}
                          {rule.actions?.convertToLead && (
                            <span className="rounded-full bg-[#111827] px-2 py-1 text-white">
                              Converter em lead
                            </span>
                          )}
                        </div>

                        {(rule.replyTemplatePublic ||
                          rule.publicReplyTemplate ||
                          rule.replyTemplatePrivate ||
                          rule.privateReplyTemplate) && (
                          <div className="mt-3 grid gap-2">
                            {(rule.replyTemplatePublic || rule.publicReplyTemplate) && (
                              <div className="rounded-lg border border-[#1F173B] bg-[#0A0322] p-2">
                                <p className="mb-1 text-[10px] text-[#9CA3AF]">
                                  Resposta pública
                                </p>
                                <p className="text-[11px] text-white">
                                  {rule.replyTemplatePublic || rule.publicReplyTemplate}
                                </p>
                              </div>
                            )}

                            {(rule.replyTemplatePrivate || rule.privateReplyTemplate) && (
                              <div className="rounded-lg border border-[#1F173B] bg-[#0A0322] p-2">
                                <p className="mb-1 text-[10px] text-[#9CA3AF]">
                                  Resposta privada
                                </p>
                                <p className="text-[11px] text-white">
                                  {rule.replyTemplatePrivate || rule.privateReplyTemplate}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => toggleInteractionRule(rule)}
                            className="rounded-lg border border-[#272046] px-3 py-1 text-xs text-white hover:bg-[#111827]"
                          >
                            {rule.active ? "Desativar" : "Ativar"}
                          </button>

                          <button
                            onClick={() => handleEdit(rule)}
                            className="rounded-lg border border-[#272046] px-3 py-1 text-xs text-white hover:bg-[#111827]"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => deleteInteractionRule(rule.id)}
                            className="rounded-lg border border-red-500 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Performance das automações
                </h2>
                <p className="text-[11px] text-[#9CA3AF]">
                  Métricas individuais por regra com foco em respostas e leads.
                </p>
              </div>
            </div>

            {loadingMetrics ? (
              <p className="text-xs text-[#9CA3AF]">Carregando métricas...</p>
            ) : metrics.length === 0 ? (
              <p className="text-xs text-[#9CA3AF]">
                Nenhuma métrica disponível ainda.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {metrics.map((m) => (
                  <div
                    key={m.ruleId}
                    className="rounded-xl border border-[#272046] bg-[#0A0322] p-4"
                  >
                    <p className="text-sm font-medium text-white">{m.ruleName}</p>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#9CA3AF]">
                      <div>Execuções: {m.executions}</div>
                      <div>Leads: {m.leads}</div>
                      <div>Resp. públicas: {m.publicReplies}</div>
                      <div>DMs: {m.privateReplies}</div>
                    </div>

                    <div className="mt-3 text-xs font-medium text-emerald-400">
                      Conversão: {(m.conversionRate * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
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
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
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

                  <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4 md:col-span-2 xl:col-span-1 2xl:col-span-2">
                    <p className="text-[11px] text-[#9CA3AF]">Conversão média</p>
                    <p className="text-lg font-semibold text-emerald-400">
                      {(metricsSummary.averageConversionRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4">
                    <p className="mb-2 text-[11px] text-[#9CA3AF]">
                      Melhor regra por leads
                    </p>
                    {metricsSummary.bestRuleByLeads ? (
                      <>
                        <p className="text-sm font-medium text-white">
                          {metricsSummary.bestRuleByLeads.ruleName}
                        </p>
                        <p className="mt-1 text-xs text-[#9CA3AF]">
                          Leads: {metricsSummary.bestRuleByLeads.leads} • Conversão:{" "}
                          {(
                            metricsSummary.bestRuleByLeads.conversionRate * 100
                          ).toFixed(1)}%
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-[#9CA3AF]">Sem dados ainda.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4">
                    <p className="mb-2 text-[11px] text-[#9CA3AF]">
                      Melhor regra por conversão
                    </p>
                    {metricsSummary.bestRuleByConversion ? (
                      <>
                        <p className="text-sm font-medium text-white">
                          {metricsSummary.bestRuleByConversion.ruleName}
                        </p>
                        <p className="mt-1 text-xs text-[#9CA3AF]">
                          Conversão:{" "}
                          {(
                            metricsSummary.bestRuleByConversion.conversionRate * 100
                          ).toFixed(1)}%
                          {" • "}
                          Leads: {metricsSummary.bestRuleByConversion.leads}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-[#9CA3AF]">Sem dados ainda.</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4">
                  <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4">
                    <p className="mb-3 text-sm font-medium text-white">
                      Ranking de regras
                    </p>

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

                  <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4">
                    <p className="mb-3 text-sm font-medium text-white">Leads por regra</p>

                    {metrics.length === 0 ? (
                      <p className="text-xs text-[#9CA3AF]">Sem dados para gráfico.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {metrics.map((m) => {
                          const width = ((m.leads || 0) / maxLeads) * 100;

                          return (
                            <div key={m.ruleId} className="flex flex-col gap-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-white">{m.ruleName}</span>
                                <span className="text-[#9CA3AF]">{m.leads} leads</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-[#111827]">
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
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-2xl rounded-3xl border border-[#272046] bg-[#020012] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Nova automação social
                </h2>
                <p className="text-[11px] text-[#9CA3AF]">
                  Fluxos para Instagram, Facebook e WhatsApp sem remover o que já
                  existia.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-[11px] text-[#9CA3AF] transition hover:text-white"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-[11px] text-[#E5E7EB]">
                  Nome da automação
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[#272046] bg-[#050016] px-3 py-2 text-[12px] text-[#E5E7EB] outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  placeholder="Ex.: Boas-vindas no Instagram"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] text-[#E5E7EB]">
                    Disparo
                  </label>
                  <select
                    value={trigger}
                    onChange={(e) =>
                      setTrigger(
                        e.target.value as SocialAccountAutomationRule["trigger"]
                      )
                    }
                    className="w-full rounded-xl border border-[#272046] bg-[#050016] px-3 py-2 text-[12px] text-[#E5E7EB] outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  >
                    {TRIGGERS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] text-[#E5E7EB]">
                    Rede
                  </label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value as NetworkType)}
                    className="w-full rounded-xl border border-[#272046] bg-[#050016] px-3 py-2 text-[12px] text-[#E5E7EB] outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-[#E5E7EB]">
                  Conta conectada
                </label>
                <label className="mt-3 flex items-center gap-2 rounded-xl border border-[#20173c] bg-[#050016] px-3 py-2 text-xs text-white">
                  <input
                    type="checkbox"
                    checked={createAlsoOnFacebook}
                    onChange={(e) => setCreateAlsoOnFacebook(e.target.checked)}
                  />
                  Criar também no Facebook, se houver conta vinculada
                </label>
                <select
                  value={socialAccountId}
                  onChange={(e) => setSocialAccountId(e.target.value)}
                  className="w-full rounded-xl border border-[#272046] bg-[#050016] px-3 py-2 text-[12px] text-[#E5E7EB] outline-none focus:ring-1 focus:ring-[#7C3AED]"
                >
                  <option value="">Selecione uma conta</option>
                  {filteredSocialAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {getNetworkLabel(normalizeNetwork(acc.network))} – {
                        acc.displayName ||
                        (acc as any).username ||
                        (acc as any).name ||
                        (acc as any).pageName ||
                        (acc as any).accountName ||
                        acc.id
                      }
                    </option>
                  ))}
                </select>

                {filteredSocialAccounts.length === 0 && (
                  <p className="mt-1 text-[10px] text-rose-400">
                    Nenhuma conta conectada para {getNetworkLabel(network)}. Vá em
                    “Contas conectadas” para vincular suas redes antes de criar
                    automações.
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] text-[#E5E7EB]">
                    Canal de envio
                  </label>
                  <select
                    value={actionChannel}
                    onChange={(e) =>
                      setActionChannel(e.target.value as AutomationChannel)
                    }
                    className="w-full rounded-xl border border-[#272046] bg-[#050016] px-3 py-2 text-[12px] text-[#E5E7EB] outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  >
                    {CHANNELS.filter((c) => {
                      if (network === "instagram") return c.id === "instagram_dm";
                      if (network === "facebook") return c.id === "facebook_dm";
                      if (network === "whatsapp") return c.id === "whatsapp";
                      return true;
                    }).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] text-[#E5E7EB]">
                    Condição (palavra-chave opcional)
                  </label>
                  <input
                    value={containsKeyword}
                    onChange={(e) => setContainsKeyword(e.target.value)}
                    className="w-full rounded-xl border border-[#272046] bg-[#050016] px-3 py-2 text-[12px] text-[#E5E7EB] outline-none focus:ring-1 focus:ring-[#7C3AED]"
                    placeholder='Ex.: "preço", "valor", "promoção"...'
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-[#E5E7EB]">
                  Template de mensagem (ID)
                </label>
                <input
                  value={messageTemplateId}
                  onChange={(e) => setMessageTemplateId(e.target.value)}
                  className="w-full rounded-xl border border-[#272046] bg-[#050016] px-3 py-2 text-[12px] text-[#E5E7EB] outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  placeholder="Ex.: welcome_default, promo_lead_whatsapp..."
                />
                <p className="mt-1 text-[10px] text-[#9CA3AF]">
                  Depois você pode ligar isso a uma tela de templates sem digitar
                  o ID manualmente.
                </p>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetSocialForm();
                    setShowForm(false);
                  }}
                  className="rounded-xl border border-[#272046] px-3 py-2 text-[12px] text-[#E5E7EB]/80 hover:bg-[#111827]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={creating}
                  onClick={handleCreate}
                  className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-2 text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {creating ? "Criando..." : "Criar automação"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
