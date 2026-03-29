// src/components/supporters/CampaignCard.tsx
"use client";

type Campaign = {
  id: string;
  title: string;
  description?: string;
  objective: string;
  status: string;
  createdAt?: string;
};

type Props = {
  campaign: Campaign;
  onDistribute: (campaignId: string) => void;
};

export function CampaignCard({ campaign, onDistribute }: Props) {
  const createdAtLabel = campaign.createdAt
    ? new Date(campaign.createdAt).toLocaleString("pt-BR")
    : "-";

  const objectiveLabel =
    campaign.objective === "reach"
      ? "Alcance"
      : campaign.objective === "followers"
      ? "Seguidores"
      : campaign.objective === "leads"
      ? "Leads"
      : "Engajamento";

  return (
    <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{campaign.title}</p>
          <p className="text-xs text-[#9CA3AF]">{campaign.description || "Sem descrição"}</p>
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] bg-sky-500/15 text-sky-400">
          {campaign.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="px-2 py-1 rounded-full bg-[#111827] text-white">
          Objetivo: {objectiveLabel}
        </span>
        <span className="px-2 py-1 rounded-full bg-[#111827] text-white">
          Criada: {createdAtLabel}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onDistribute(campaign.id)}
        className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-sm font-medium text-white px-4 py-2"
      >
        Distribuir aos apoiadores
      </button>
    </div>
  );
}