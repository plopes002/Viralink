// src/components/supporters/InteractionCard.tsx
"use client";

import { useMemo, useState } from "react";

type Interaction = {
  id: string;
  sourceName: string;
  sourceUsername?: string;
  commenterUsername: string;
  commenterText: string;
  status: string;
  createdAt?: string;

  automationMatched?: boolean;
  automationRuleId?: string | null;
  automationRuleName?: string | null;
  automationExecutedActions?: string[];
  processedAt?: string | null;

  publicReplyText?: string | null;
  privateReplyText?: string | null;

  publicReplyMeta?: {
    automated?: boolean;
    sentAt?: string;
    ruleId?: string;
  } | null;

  privateReplyMeta?: {
    automated?: boolean;
    sentAt?: string;
    ruleId?: string;
  } | null;
};

type Props = {
  interaction: Interaction;
  onRefresh: () => void;
};

export function InteractionCard({ interaction, onRefresh }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleStatusChange(status: string) {
    try {
      setBusy(true);

      const res = await fetch("/api/network/interactions/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interactionId: interaction.id,
          status,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao atualizar status.");
      }

      onRefresh();
    } catch (error: any) {
      alert(error?.message || "Erro ao atualizar status.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConvertToLead() {
    try {
      setBusy(true);

      const res = await fetch("/api/network/interactions/convert-to-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interactionId: interaction.id,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao converter em lead.");
      }

      onRefresh();
      alert("Interação convertida em lead.");
    } catch (error: any) {
      alert(error?.message || "Erro ao converter em lead.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePublicReply() {
    const message = window.prompt("Digite a resposta pública:");

    if (!message?.trim()) return;

    try {
      setBusy(true);

      const res = await fetch("/api/network/interactions/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interactionId: interaction.id,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao responder comentário.");
      }

      alert("Comentário respondido com sucesso.");
      onRefresh();
    } catch (error: any) {
      alert(error?.message || "Erro ao responder comentário.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePrivateReply() {
    const message = window.prompt("Digite a resposta privada:");

    if (!message?.trim()) return;

    try {
      setBusy(true);

      const res = await fetch("/api/network/interactions/private-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interactionId: interaction.id,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao enviar resposta privada.");
      }

      alert("Resposta privada enviada com sucesso.");
      onRefresh();
    } catch (error: any) {
      alert(error?.message || "Erro ao enviar resposta privada.");
    } finally {
      setBusy(false);
    }
  }

  const createdAtLabel = interaction.createdAt
    ? new Date(interaction.createdAt).toLocaleString("pt-BR")
    : "-";

  const processedAtLabel = interaction.processedAt
    ? new Date(interaction.processedAt).toLocaleString("pt-BR")
    : null;

  const executedActions = useMemo(() => {
    const raw = Array.isArray(interaction.automationExecutedActions)
      ? interaction.automationExecutedActions
      : [];

    const labelMap: Record<string, string> = {
      markAsRead: "Marcou como lido",
      publicReply: "Resposta pública",
      privateReply: "Resposta privada",
      convertToLead: "Virou lead",
    };

    return raw.map((action) => labelMap[action] || action);
  }, [interaction.automationExecutedActions]);

  const statusBadgeClass = (() => {
    switch (interaction.status) {
      case "lead":
        return "bg-cyan-500/15 text-cyan-300";
      case "private_replied":
        return "bg-sky-500/15 text-sky-300";
      case "replied":
        return "bg-emerald-500/15 text-emerald-300";
      case "read":
        return "bg-yellow-500/15 text-yellow-300";
      case "archived":
        return "bg-zinc-500/15 text-zinc-300";
      default:
        return "bg-violet-500/15 text-violet-300";
    }
  })();

  return (
    <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{interaction.sourceName}</p>
          <p className="text-xs text-[#9CA3AF]">
            {interaction.sourceUsername || "Sem username"}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-[10px] ${statusBadgeClass}`}
        >
          {interaction.status}
        </span>
      </div>

      <div className="rounded-lg border border-[#1F173B] bg-[#050016] p-3">
        <p className="text-xs text-[#9CA3AF] mb-1">
          Comentário de @{interaction.commenterUsername}
        </p>
        <p className="text-sm text-white">{interaction.commenterText}</p>
      </div>

      <p className="text-[10px] text-[#9CA3AF]">Recebido em: {createdAtLabel}</p>

      {interaction.automationMatched && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-emerald-300">
              ⚡ Automação executada
            </p>

            {processedAtLabel && (
              <span className="text-[10px] text-emerald-200/80">
                {processedAtLabel}
              </span>
            )}
          </div>

          {interaction.automationRuleName && (
            <p className="text-[11px] text-white">
              Regra:{" "}
              <span className="font-medium">{interaction.automationRuleName}</span>
            </p>
          )}

          {executedActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {executedActions.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-[#111827] px-2.5 py-1 text-[10px] text-white"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {(interaction.publicReplyMeta?.automated ||
            interaction.privateReplyMeta?.automated) && (
            <div className="grid gap-2">
              {interaction.publicReplyMeta?.automated && interaction.publicReplyText && (
                <div className="rounded-md border border-[#1F173B] bg-[#050016] p-2">
                  <p className="text-[10px] text-[#9CA3AF] mb-1">
                    Resposta pública automática
                  </p>
                  <p className="text-[11px] text-white">{interaction.publicReplyText}</p>
                </div>
              )}

              {interaction.privateReplyMeta?.automated &&
                interaction.privateReplyText && (
                  <div className="rounded-md border border-[#1F173B] bg-[#050016] p-2">
                    <p className="text-[10px] text-[#9CA3AF] mb-1">
                      Resposta privada automática
                    </p>
                    <p className="text-[11px] text-white">{interaction.privateReplyText}</p>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => handleStatusChange("read")}
          className="rounded-lg border border-[#272046] text-xs text-white px-3 py-2 disabled:opacity-60"
        >
          Marcar como lido
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={handlePublicReply}
          className="rounded-lg border border-[#272046] text-xs text-white px-3 py-2 disabled:opacity-60"
        >
          Resposta pública
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={handlePrivateReply}
          className="rounded-lg border border-[#272046] text-xs text-white px-3 py-2 disabled:opacity-60"
        >
          Resposta privada
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={handleConvertToLead}
          className="rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-xs font-medium text-white px-3 py-2 disabled:opacity-60"
        >
          Virar lead
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => handleStatusChange("archived")}
          className="rounded-lg border border-[#272046] text-xs text-white px-3 py-2 disabled:opacity-60"
        >
          Arquivar
        </button>
      </div>
    </div>
  );
}