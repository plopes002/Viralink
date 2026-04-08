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

  const workspaceId = currentWorkspace?.id || currentWorkspace?.workspaceId || "";

  useEffect(() => {
    if (!workspaceId) return;

    let aborted = false;

    (async () => {
      try {
        const res = await fetch(`/api/social-accounts/list?workspaceId=${workspaceId}&network=instagram`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "Erro ao carregar contas");

        if (!aborted) {
          const loadedAccounts = Array.isArray(data.accounts) ? data.accounts : [];
          setAccounts(loadedAccounts);

          if (!selectedSocialAccountId && loadedAccounts.length > 0) {
            const preferred =
              loadedAccounts.find((a: SocialAccount) => a.isPrimary) || loadedAccounts[0];
            setSelectedSocialAccountId(preferred.id);
          }
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

      if (!res.ok) throw new Error(data?.error || "Erro ao carregar conversas");

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

      if (!res.ok) throw new Error(data?.error || "Erro ao carregar mensagens");

      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar mensagens");
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    if (!workspaceId || !selectedSocialAccountId) return;
    loadThreads();
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

      if (!res.ok) throw new Error(data?.error || "Erro ao enviar mensagem");

      setComposerText("");
      setSuccess("Mensagem enviada com sucesso.");
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

      if (!res.ok) throw new Error(data?.error || "Erro ao excluir mensagem");

      setSuccess("Mensagem removida da visualização do sistema.");
      await loadMessages(selectedThread.id);
      await loadThreads();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir mensagem");
    }
  }

  async function handleToggleAutomation() {
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

      if (!res.ok) throw new Error(data?.error || "Erro ao atualizar automação");

      setSuccess(
        !selectedThread.automationEnabled
          ? "Automação ativada para esta conversa."
          : "Automação pausada para esta conversa."
      );

      await loadThreads();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar automação");
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

      if (!res.ok) throw new Error(data?.error || "Erro ao arquivar conversa");

      setSuccess("Conversa arquivada.");
      setSelectedThread(null);
      await loadThreads();
    } catch (err: any) {
      setError(err.message || "Erro ao arquivar conversa");
    }
  }

  if (workspaceLoading) {
    return <div className="p-6 text-sm text-gray-500">Carregando workspace...</div>;
  }

  if (!workspaceId) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Inbox</h1>
        <p className="mt-3 text-sm text-red-600">
          Workspace não encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-90px)] flex-col p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inbox / Direct</h1>
          <p className="text-sm text-gray-500">
            Visualize e responda mensagens do Instagram Direct por workspace, com controle manual e automações de DM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSocialAccountId}
            onChange={(e) => setSelectedSocialAccountId(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
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
            className="rounded-lg bg-black px-4 py-2 text-sm text-white"
          >
            Atualizar
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        <aside className="flex min-h-0 flex-col rounded-2xl border bg-white">
          <div className="border-b p-4">
            <div className="mb-2 text-sm font-medium">Conversas</div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nome, @username ou texto..."
              className="mb-2 w-full rounded-lg border px-3 py-2 text-sm"
            />

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="all">Todos os status</option>
                <option value="open">Abertas</option>
                <option value="pending">Pendentes</option>
                <option value="closed">Fechadas</option>
                <option value="archived">Arquivadas</option>
              </select>

              <button
                onClick={loadThreads}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Buscar
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingThreads ? (
              <div className="p-4 text-sm text-gray-500">Carregando conversas...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                Nenhuma conversa encontrada.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const active = selectedThread?.id === thread.id;

                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`flex w-full items-start gap-3 border-b p-4 text-left transition ${
                      active ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold uppercase text-gray-700">
                      {(thread.customerName || thread.customerUsername || "?").slice(0, 1)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-medium">
                          {thread.customerName || "Sem nome"}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {thread.lastMessageAt
                            ? new Date(thread.lastMessageAt).toLocaleString("pt-BR")
                            : "--"}
                        </div>
                      </div>

                      <div className="truncate text-xs text-gray-500">
                        @{thread.customerUsername || "usuario"}
                      </div>

                      <div className="mt-1 truncate text-sm text-gray-700">
                        {thread.lastMessageText || "Sem mensagens"}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
                          {thread.status || "open"}
                        </span>

                        {thread.unreadCount ? (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] text-red-700">
                            {thread.unreadCount} não lida(s)
                          </span>
                        ) : null}

                        {thread.automationEnabled ? (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] text-blue-700">
                            automação ativa
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex min-h-0 flex-col rounded-2xl border bg-white">
          {!selectedThread ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-500">
              Selecione uma conversa para visualizar o histórico e responder.
            </div>
          ) : (
            <>
              <div className="border-b p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {selectedThread.customerName || "Sem nome"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      @{selectedThread.customerUsername || "usuario"} · Thread:{" "}
                      {selectedThread.platformThreadId || selectedThread.id}
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Esta Inbox só permite responder conversas já existentes. O sistema não inicia DM sem interação prévia do usuário.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleArchiveThread}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      Arquivar
                    </button>

                    <button
                      onClick={handleToggleAutomation}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      {selectedThread.automationEnabled ? "Pausar automação" : "Ativar automação"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-4">
                {loadingMessages ? (
                  <div className="text-sm text-gray-500">Carregando mensagens...</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-gray-500">Nenhuma mensagem nesta conversa.</div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => {
                      const isOutbound = message.direction === "outbound";

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                              isOutbound ? "bg-black text-white" : "bg-white text-gray-900"
                            }`}
                          >
                            <div className="mb-1 flex items-center gap-2 text-[11px] opacity-80">
                              <span>
                                {message.senderType === "automation"
                                  ? "Automação"
                                  : message.senderType === "agent"
                                  ? "Manual"
                                  : message.senderType === "customer"
                                  ? "Cliente"
                                  : "Sistema"}
                              </span>

                              <span>•</span>

                              <span>
                                {message.sentAt
                                  ? new Date(message.sentAt).toLocaleString("pt-BR")
                                  : "--"}
                              </span>

                              {message.deliveryStatus ? (
                                <>
                                  <span>•</span>
                                  <span>{message.deliveryStatus}</span>
                                </>
                              ) : null}
                            </div>

                            <div className="whitespace-pre-wrap break-words text-sm">
                              {message.isDeleted ? (
                                <span className="italic opacity-70">
                                  Mensagem removida da visualização do sistema.
                                </span>
                              ) : (
                                message.text || "-"
                              )}
                            </div>

                            {!message.isDeleted ? (
                              <div className="mt-3 flex justify-end">
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className={`text-xs underline ${
                                    isOutbound ? "text-white/90" : "text-red-600"
                                  }`}
                                >
                                  Excluir do sistema
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t p-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Envio manual permitido apenas em threads existentes com interação prévia. Sem thread válida, o backend bloqueia o envio.
                </div>

                <div className="mt-3 flex gap-2">
                  <textarea
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    rows={3}
                    placeholder="Digite sua resposta manual..."
                    className="min-h-[88px] flex-1 rounded-xl border px-3 py-3 text-sm outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !composerText.trim()}
                    className="rounded-xl bg-black px-5 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? "Enviando..." : "Responder"}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>

        <aside className="flex min-h-0 flex-col rounded-2xl border bg-white">
          <div className="border-b p-4">
            <div className="text-sm font-medium">Automação de DM</div>
            <p className="mt-1 text-xs text-gray-500">
              Regras simples para atendimento de mensagens recebidas no Instagram Direct.
            </p>
          </div>

          <div className="space-y-4 p-4 text-sm">
            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="font-medium">Regras de conformidade</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-600">
                <li>não iniciar conversa sem Direct prévio</li>
                <li>não usar para spam</li>
                <li>responder apenas interações legítimas</li>
                <li>isolamento por workspace e conta conectada</li>
              </ul>
            </div>

            <div className="rounded-xl border p-3">
              <div className="font-medium">Situação da conversa</div>
              {selectedThread ? (
                <div className="mt-2 space-y-2 text-xs text-gray-600">
                  <div>
                    <strong>Status:</strong> {selectedThread.status || "open"}
                  </div>
                  <div>
                    <strong>Automação:</strong>{" "}
                    {selectedThread.automationEnabled ? "ativa" : "pausada"}
                  </div>
                  <div>
                    <strong>Conta:</strong> {selectedThread.socialAccountId}
                  </div>
                  <div>
                    <strong>Thread:</strong> {selectedThread.platformThreadId || selectedThread.id}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-xs text-gray-500">
                  Selecione uma conversa para ver os detalhes.
                </div>
              )}
            </div>

            <div className="rounded-xl border p-3">
              <div className="font-medium">Exemplos de ação</div>
              <div className="mt-2 space-y-2 text-xs text-gray-600">
                <div>• Responder automaticamente após nova mensagem</div>
                <div>• Pausar automação e assumir manualmente</div>
                <div>• Marcar lead quente</div>
                <div>• Encaminhar para equipe</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
