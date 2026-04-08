// src/app/(app)/inbox/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";

type InboxThread = {
  id: string;
  workspaceId: string;
  socialAccountId: string;
  network: "instagram";
  platformThreadId: string;
  customerId?: string;
  customerUsername?: string;
  customerName?: string;
  customerProfilePic?: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  lastMessageDirection?: "inbound" | "outbound";
  unreadCount?: number;
  status?: "open" | "pending" | "closed" | "archived";
  automationEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type InboxMessage = {
  id: string;
  workspaceId: string;
  threadId: string;
  socialAccountId: string;
  network: "instagram";
  platformMessageId?: string;
  direction: "inbound" | "outbound";
  senderType: "customer" | "agent" | "automation" | "system";
  text: string;
  sentAt?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deliveryStatus?: string;
  createdAt?: string;
};

type SocialAccount = {
  id: string;
  name?: string;
  username?: string;
  network?: string;
  status?: string;
  isPrimary?: boolean;
};

type InboxAutomationRule = {
  id?: string;
  workspaceId?: string;
  socialAccountId?: string;
  enabled: boolean;
  trigger: "new_message";
  matchType: "any" | "contains";
  containsText: string;
  responseText: string;
  delaySeconds: number;
  onlyFirstMessage: boolean;
  activeHoursOnly?: boolean;
};

const DEFAULT_RULE: InboxAutomationRule = {
  enabled: false,
  trigger: "new_message",
  matchType: "any",
  containsText: "",
  responseText: "",
  delaySeconds: 0,
  onlyFirstMessage: false,
  activeHoursOnly: false,
};

function formatDateTime(value?: string) {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleString("pt-BR");
  } catch {
    return "--";
  }
}

function getAvatarLabel(thread?: InboxThread | null) {
  const base =
    thread?.customerName?.trim() ||
    thread?.customerUsername?.trim() ||
    "?";
  return base.slice(0, 1).toUpperCase();
}

function getThreadDisplayName(thread?: InboxThread | null) {
  return (
    thread?.customerName?.trim() ||
    (thread?.customerUsername ? `@${thread.customerUsername}` : "Contato")
  );
}

export default function InboxPage() {
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedSocialAccountId, setSelectedSocialAccountId] = useState("");
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<InboxThread | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rule, setRule] = useState<InboxAutomationRule>(DEFAULT_RULE);
  const [loadingRule, setLoadingRule] = useState(false);
  const [savingRule, setSavingRule] = useState(false);

  const workspaceId = currentWorkspace?.id || currentWorkspace?.workspaceId || "";

  useEffect(() => {
    if (!workspaceId) return;

    let aborted = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/social-accounts/list?workspaceId=${workspaceId}&network=instagram`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Erro ao carregar contas");
        }

        if (aborted) return;

        const loadedAccounts = Array.isArray(data.accounts) ? data.accounts : [];
        setAccounts(loadedAccounts);

        if (!selectedSocialAccountId && loadedAccounts.length > 0) {
          const preferred =
            loadedAccounts.find((a: SocialAccount) => a.isPrimary) || loadedAccounts[0];
          setSelectedSocialAccountId(preferred.id);
        }
      } catch (err: any) {
        if (!aborted) setError(err.message || "Erro ao carregar contas conectadas");
      }
    })();

    return () => {
      aborted = true;
    };
  }, [workspaceId, selectedSocialAccountId]);

  const filteredThreads = useMemo(() => {
    const term = search.trim().toLowerCase();

    return threads.filter((thread) => {
      const name = (thread.customerName || "").toLowerCase();
      const username = (thread.customerUsername || "").toLowerCase();
      const lastMessage = (thread.lastMessageText || "").toLowerCase();

      if (statusFilter && statusFilter !== "all" && thread.status !== statusFilter) {
        return false;
      }

      if (!term) return true;

      return (
        name.includes(term) ||
        username.includes(term) ||
        lastMessage.includes(term)
      );
    });
  }, [threads, search, statusFilter]);

  async function loadThreads() {
    if (!workspaceId || !selectedSocialAccountId) return;

    setLoadingThreads(true);
    setError("");

    try {
      const qs = new URLSearchParams({
        workspaceId,
        socialAccountId: selectedSocialAccountId,
        network: "instagram",
        status: statusFilter,
        search,
      });

      const res = await fetch(`/api/inbox/threads?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar conversas");
      }

      const nextThreads = Array.isArray(data.threads) ? data.threads : [];
      setThreads(nextThreads);

      if (selectedThread) {
        const refreshed = nextThreads.find((t: InboxThread) => t.id === selectedThread.id);
        setSelectedThread(refreshed || null);
      } else if (nextThreads.length > 0) {
        setSelectedThread(nextThreads[0]);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar conversas");
    } finally {
      setLoadingThreads(false);
    }
  }

  async function loadMessages(threadId: string) {
    if (!workspaceId || !threadId) return;

    setLoadingMessages(true);
    setError("");

    try {
      const qs = new URLSearchParams({
        workspaceId,
        threadId,
      });

      const res = await fetch(`/api/inbox/messages?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar mensagens");
      }

      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar mensagens");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function loadAutomationRule() {
    if (!workspaceId || !selectedSocialAccountId) return;

    setLoadingRule(true);

    try {
      const qs = new URLSearchParams({
        workspaceId,
        socialAccountId: selectedSocialAccountId,
      });

      const res = await fetch(`/api/inbox/automation-rule?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar automação");
      }

      setRule(data.rule || DEFAULT_RULE);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar automação");
      setRule(DEFAULT_RULE);
    } finally {
      setLoadingRule(false);
    }
  }

  useEffect(() => {
    if (!workspaceId || !selectedSocialAccountId) return;
    loadThreads();
    loadAutomationRule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, selectedSocialAccountId, statusFilter]);

  useEffect(() => {
    if (!selectedThread?.id) {
      setMessages([]);
      return;
    }
    loadMessages(selectedThread.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThread?.id]);

  async function handleSendMessage() {
    if (!workspaceId || !selectedThread?.id) return;
    if (!composerText.trim()) return;

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/inbox/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          threadId: selectedThread.id,
          text: composerText.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao enviar mensagem");
      }

      if (data?.graphDebug && !data?.graphDebug?.ok) {
        setError(data?.warning || "Envio externo não confirmado.");
      } else {
        setSuccess("Mensagem enviada com sucesso.");
      }

      setComposerText("");
      await loadMessages(selectedThread.id);
      await loadThreads();
    } catch (err: any) {
      setError(err.message || "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!workspaceId || !selectedThread?.id || !messageId) return;

    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/inbox/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          threadId: selectedThread.id,
          messageId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao excluir mensagem");
      }

      setSuccess("Mensagem removida da visualização do sistema.");
      await loadMessages(selectedThread.id);
      await loadThreads();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir mensagem");
    }
  }

  async function handleArchiveThread() {
    if (!workspaceId || !selectedThread?.id) return;

    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/inbox/thread-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          threadId: selectedThread.id,
          status: "archived",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao arquivar conversa");
      }

      setSuccess("Conversa arquivada.");
      setSelectedThread(null);
      await loadThreads();
    } catch (err: any) {
      setError(err.message || "Erro ao arquivar conversa");
    }
  }

  async function handleToggleThreadAutomation() {
    if (!workspaceId || !selectedThread?.id) return;

    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/inbox/thread-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          threadId: selectedThread.id,
          automationEnabled: !selectedThread.automationEnabled,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao atualizar automação da conversa");
      }

      setSuccess(
        !selectedThread.automationEnabled
          ? "Automação da conversa ativada."
          : "Automação da conversa pausada."
      );

      await loadThreads();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar automação da conversa");
    }
  }

  async function handleSaveAutomationRule() {
    if (!workspaceId || !selectedSocialAccountId) return;

    setSavingRule(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/inbox/automation-rule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          socialAccountId: selectedSocialAccountId,
          rule,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar automação");
      }

      setSuccess("Automação de DM salva com sucesso.");
      setRule(data.rule || rule);
      await loadThreads();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar automação");
    } finally {
      setSavingRule(false);
    }
  }

  if (workspaceLoading) {
    return <div className="p-6 text-sm text-gray-500">Carregando workspace...</div>;
  }

  if (!workspaceId) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Inbox</h1>
        <p className="mt-3 text-sm text-red-600">Workspace não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-86px)] bg-[#f6f7fb] p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-3 rounded-3xl bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Inbox / Direct</h1>
          <p className="text-sm text-slate-500">
            Central de mensagens do Instagram com atendimento manual e automação de resposta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSocialAccountId}
            onChange={(e) => setSelectedSocialAccountId(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none"
          >
            <option value="">Selecione a conta</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name || account.username || account.id}
              </option>
            ))}
          </select>

          <button
            onClick={loadThreads}
            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            Atualizar
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="grid h-[calc(100%-110px)] grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)_360px]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-900">Conversas</div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nome, @username ou texto..."
              className="mb-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            />

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              >
                <option value="all">Todos os status</option>
                <option value="open">Abertas</option>
                <option value="pending">Pendentes</option>
                <option value="closed">Fechadas</option>
                <option value="archived">Arquivadas</option>
              </select>

              <button
                onClick={loadThreads}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              >
                Buscar
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingThreads ? (
              <div className="p-4 text-sm text-slate-500">Carregando conversas...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">Nenhuma conversa encontrada.</div>
            ) : (
              filteredThreads.map((thread) => {
                const active = selectedThread?.id === thread.id;

                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full border-b border-slate-100 p-4 text-left transition ${
                      active ? "bg-slate-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                        {getAvatarLabel(thread)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {getThreadDisplayName(thread)}
                          </div>
                          <div className="shrink-0 text-[11px] text-slate-400">
                            {thread.lastMessageAt
                              ? new Date(thread.lastMessageAt).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "--"}
                          </div>
                        </div>

                        <div className="mt-1 truncate text-sm text-slate-600">
                          {thread.lastMessageText || "Sem mensagens"}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                            {thread.status || "open"}
                          </span>

                          {!!thread.unreadCount && (
                            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] text-rose-700">
                              {thread.unreadCount} não lida(s)
                            </span>
                          )}

                          {thread.automationEnabled && (
                            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] text-indigo-700">
                              automação ativa
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white shadow-sm">
          {!selectedThread ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
              Selecione uma conversa para visualizar o histórico e responder.
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                        {getAvatarLabel(selectedThread)}
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold text-slate-900">
                          {getThreadDisplayName(selectedThread)}
                        </h2>
                        <p className="truncate text-sm text-slate-500">
                          {selectedThread.customerUsername
                            ? `@${selectedThread.customerUsername}`
                            : "Usuário identificado pelo Direct"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      Esta Inbox só permite responder conversas já iniciadas pelo usuário.
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleToggleThreadAutomation}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                    >
                      {selectedThread.automationEnabled
                        ? "Pausar automação"
                        : "Ativar automação"}
                    </button>

                    <button
                      onClick={handleArchiveThread}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                    >
                      Arquivar
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 px-4 py-5">
                {loadingMessages ? (
                  <div className="text-sm text-slate-500">Carregando mensagens...</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-slate-500">Nenhuma mensagem nesta conversa.</div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOutbound = message.direction === "outbound";
                      const isSystemDeleted = !!message.isDeleted;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-[22px] px-4 py-3 shadow-sm ${
                              isOutbound
                                ? "bg-indigo-600 text-white"
                                : "border border-slate-200 bg-white text-slate-900"
                            }`}
                          >
                            <div
                              className={`mb-2 flex items-center gap-2 text-[11px] ${
                                isOutbound ? "text-indigo-100" : "text-slate-400"
                              }`}
                            >
                              <span>
                                {message.senderType === "automation"
                                  ? "Automação"
                                  : message.senderType === "agent"
                                  ? "Você"
                                  : message.senderType === "customer"
                                  ? "Cliente"
                                  : "Sistema"}
                              </span>
                              <span>•</span>
                              <span>{formatDateTime(message.sentAt)}</span>
                            </div>

                            <div className="whitespace-pre-wrap break-words text-sm">
                              {isSystemDeleted ? (
                                <span className="italic opacity-75">
                                  Mensagem removida da visualização do sistema.
                                </span>
                              ) : (
                                message.text || "-"
                              )}
                            </div>

                            {!isSystemDeleted && (
                              <div className="mt-3 flex justify-end">
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className={`text-xs underline ${
                                    isOutbound ? "text-indigo-100" : "text-rose-600"
                                  }`}
                                >
                                  Excluir do sistema
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 p-4">
                <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  Envio manual permitido apenas em conversas existentes com interação prévia.
                </div>

                <div className="flex gap-3">
                  <textarea
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={3}
                    placeholder="Digite sua resposta manual..."
                    className="min-h-[100px] flex-1 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !composerText.trim()}
                    className="min-w-[130px] rounded-3xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? "Enviando..." : "Responder"}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="text-sm font-semibold text-slate-900">Automação de DM</div>
            <p className="mt-1 text-sm text-slate-500">
              Configure respostas automáticas para novas mensagens do Instagram Direct.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {loadingRule ? (
              <div className="text-sm text-slate-500">Carregando automação...</div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Resposta automática</div>
                      <div className="text-xs text-slate-500">
                        Só responde mensagens recebidas de forma legítima.
                      </div>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) =>
                          setRule((prev) => ({ ...prev, enabled: e.target.checked }))
                        }
                      />
                      <span className="text-sm text-slate-700">
                        {rule.enabled ? "Ativa" : "Pausada"}
                      </span>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Quando receber
                      </label>
                      <select
                        value={rule.matchType}
                        onChange={(e) =>
                          setRule((prev) => ({
                            ...prev,
                            matchType: e.target.value as "any" | "contains",
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                      >
                        <option value="any">Qualquer nova mensagem</option>
                        <option value="contains">Mensagem contendo palavra</option>
                      </select>
                    </div>

                    {rule.matchType === "contains" && (
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Palavra ou trecho
                        </label>
                        <input
                          value={rule.containsText}
                          onChange={(e) =>
                            setRule((prev) => ({ ...prev, containsText: e.target.value }))
                          }
                          placeholder="Ex.: preço, orçamento, oi"
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Responder com
                      </label>
                      <textarea
                        value={rule.responseText}
                        onChange={(e) =>
                          setRule((prev) => ({ ...prev, responseText: e.target.value }))
                        }
                        rows={5}
                        placeholder="Ex.: Olá! Recebi sua mensagem e já vou te atender 😊"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Delay
                        </label>
                        <select
                          value={String(rule.delaySeconds)}
                          onChange={(e) =>
                            setRule((prev) => ({
                              ...prev,
                              delaySeconds: Number(e.target.value || 0),
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                        >
                          <option value="0">Sem atraso</option>
                          <option value="3">3 segundos</option>
                          <option value="5">5 segundos</option>
                          <option value="10">10 segundos</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={rule.onlyFirstMessage}
                            onChange={(e) =>
                              setRule((prev) => ({
                                ...prev,
                                onlyFirstMessage: e.target.checked,
                              }))
                            }
                          />
                          Só na primeira mensagem
                        </label>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!rule.activeHoursOnly}
                        onChange={(e) =>
                          setRule((prev) => ({
                            ...prev,
                            activeHoursOnly: e.target.checked,
                          }))
                        }
                      />
                      Aplicar apenas em horário comercial
                    </label>

                    <button
                      onClick={handleSaveAutomationRule}
                      disabled={savingRule}
                      className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {savingRule ? "Salvando..." : "Salvar automação"}
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-4">
                  <div className="text-sm font-semibold text-slate-900">Conformidade</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>• não iniciar conversa sem Direct prévio</li>
                    <li>• não usar automação para spam</li>
                    <li>• responder apenas interações legítimas</li>
                    <li>• manter isolamento por workspace e conta conectada</li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-slate-200 p-4">
                  <div className="text-sm font-semibold text-slate-900">Status da conversa</div>
                  {selectedThread ? (
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <div>
                        <strong>Status:</strong> {selectedThread.status || "open"}
                      </div>
                      <div>
                        <strong>Automação na conversa:</strong>{" "}
                        {selectedThread.automationEnabled ? "ativa" : "pausada"}
                      </div>
                      <div>
                        <strong>Conta:</strong> {selectedThread.socialAccountId}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-slate-500">
                      Selecione uma conversa para ver detalhes.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}