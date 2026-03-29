// src/components/supporters/SupporterCard.tsx
"use client";

import { useState } from "react";

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

type Props = {
  supporter: Supporter;
  onUpdated: () => void;
};

export function SupporterCard({ supporter, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);

  const permissions = supporter.permissions ?? {
    allowContentBoost: true,
    allowLeadCapture: false,
    allowFollowerCampaigns: true,
  };

  async function handleToggle(key: keyof typeof permissions) {
    try {
      setSaving(true);

      const nextPermissions = {
        ...permissions,
        [key]: !permissions[key],
      };

      const res = await fetch("/api/network/supporters/update-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supporterAccountId: supporter.id,
          permissions: nextPermissions,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao atualizar permissões.");
      }

      onUpdated();
    } catch (error: any) {
      alert(error?.message || "Erro ao atualizar permissões.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    const confirmed = confirm(
      `Deseja remover o vínculo do apoiador ${supporter.name}?`
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      const res = await fetch("/api/network/supporters/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supporterAccountId: supporter.id,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao remover apoiador.");
      }

      onUpdated();
    } catch (error: any) {
      alert(error?.message || "Erro ao remover apoiador.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{supporter.name}</p>
          <p className="text-xs text-[#9CA3AF]">
            {supporter.username || "Sem username"}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-[10px] ${
            supporter.status === "connected"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-rose-500/15 text-rose-400"
          }`}
        >
          {supporter.status === "connected" ? "Ativo" : "Revogado"}
        </span>
      </div>

      <div className="grid gap-2">
        <label className="flex items-center justify-between rounded-lg border border-[#1F173B] bg-[#050016] px-3 py-2 text-xs text-white">
          <span>Impulsionar conteúdo</span>
          <input
            type="checkbox"
            checked={permissions.allowContentBoost}
            disabled={saving || supporter.status !== "connected"}
            onChange={() => handleToggle("allowContentBoost")}
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-[#1F173B] bg-[#050016] px-3 py-2 text-xs text-white">
          <span>Captura de leads</span>
          <input
            type="checkbox"
            checked={permissions.allowLeadCapture}
            disabled={saving || supporter.status !== "connected"}
            onChange={() => handleToggle("allowLeadCapture")}
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-[#1F173B] bg-[#050016] px-3 py-2 text-xs text-white">
          <span>Campanha de seguidores</span>
          <input
            type="checkbox"
            checked={permissions.allowFollowerCampaigns}
            disabled={saving || supporter.status !== "connected"}
            onChange={() => handleToggle("allowFollowerCampaigns")}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleRemove}
        disabled={saving || supporter.status !== "connected"}
        className="rounded-xl border border-[#4B1D2A] text-[#FCA5A5] text-xs py-2 hover:bg-[#111827] disabled:opacity-60"
      >
        Remover vínculo
      </button>
    </div>
  );
}