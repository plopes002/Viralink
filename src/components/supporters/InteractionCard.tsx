// src/components/supporters/InteractionCard.tsx
"use client";

import { useState } from "react";

type Interaction = {
  id: string;
  sourceName: string;
  sourceUsername?: string;
  commenterUsername: string;
  commenterText: string;
  status: string;
  createdAt?: string;
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

  return (
    <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{interaction.sourceName}</p>
          <p className="text-xs text-[#9CA3AF]">
            {interaction.sourceUsername || "Sem username"}
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] bg-violet-500/15 text-violet-300">
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