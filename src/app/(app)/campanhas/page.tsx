// src/app/(app)/campanhas/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useEngagementProfiles } from "@/hooks/useEngagementProfiles";
import { useCampaigns } from "@/hooks/useCampaigns";
import type { CampaignChannel } from "@/types/campaign";
import { useMessages } from "@/hooks/useMessages";
import { useQueuePolling } from "@/hooks/useQueuePolling";

type TemperatureFilter = "all" | "cold" | "warm" | "hot" | "priority";
type FollowFilter = "all" | "followers" | "non_followers";

function getStatusClass(status?: string) {
  if (status === "done") return "bg-emerald-500/15 text-emerald-400";
  if (status === "processing") return "bg-sky-500/15 text-sky-400";
  if (status === "error") return "bg-rose-500/15 text-rose-400";
  return "bg-amber-500/15 text-amber-400";
}

export default function CampanhasPage() {
  const { currentWorkspace } = useWorkspace() as any;
  const workspaceId = currentWorkspace?.id;

  const { profiles, loading } = useEngagementProfiles(workspaceId);
  const { campaigns } = useCampaigns(workspaceId);
  const { messages } = useMessages(workspaceId);
  
  useQueuePolling({
    enabled: !!workspaceId,
    intervalMs: 20000,
  });


  const [name, setName] = useState("");
  const [channel, setChannel] = useState<CampaignChannel>("instagram_dm");
  const [message, setMessage] = useState("");
  const [temperature, setTemperature] =
    useState<TemperatureFilter>("all");
  const [followStatus, setFollowStatus] =
    useState<FollowFilter>("all");
  const [category, setCategory] = useState("all");
  const [operationalTag, setOperationalTag] = useState("all");
  const [search, setSearch] = useState("");
  const [dispatching, setDispatching] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach((p) => (p.categories || []).forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [profiles]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach((p) =>
      (p.operationalTags || []).forEach((t) => set.add(t)),
    );
    return Array.from(set).sort();
  }, [profiles]);

  const previewRecipients = useMemo(() => {
    return profiles.filter((profile) => {
      if (temperature !== "all" && profile.leadTemperature !== temperature) {
        return false;
      }

      if (followStatus === "followers" && !profile.isFollower) {
        return false;
      }

      if (followStatus === "non_followers" && profile.isFollower) {
        return false;
      }

      if (category !== "all" && !(profile.categories || []).includes(category)) {
        return false;
      }

      if (
        operationalTag !== "all" &&
        !(profile.operationalTags || []).includes(operationalTag)
      ) {
        return false;
      }

      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const haystack = [
          profile.name,
          profile.username,
          ...(profile.categories || []),
          ...(profile.interestTags || []),
          ...(profile.operationalTags || []),
          ...(profile.politicalEntities || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  }, [profiles, temperature, followStatus, category, operationalTag, search]);

  async function handleDispatch() {
    if (!workspaceId) return;
    if (!name.trim() || !message.trim()) {
      alert("Preencha o nome da campanha e a mensagem.");
      return;
    }

    setDispatching(true);
    try {
      const res = await fetch("/api/campaigns/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          name: name.trim(),
          channel,
          message,
          filters: {
            temperature,
            followStatus,
            category,
            operationalTag,
            search,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao disparar campanha.");
        return;
      }

      alert(
        data?.limited
          ? `Campanha criada com limite de segurança. ${data.note}`
          : `Campanha criada com sucesso para ${data.recipientsCount} perfil(is).`,
      );

      setName("");
      setMessage("");
    } finally {
      setDispatching(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-white">
          Central de Campanhas
        </h1>
        <p className="text-sm text-[#9CA3AF]">
          Monte campanhas usando filtros inteligentes e dispare ações para públicos segmentados.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Mensagens na fila</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {messages.filter((m) => m.status === "queued").length}
          </p>
        </div>
      
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Processando</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {messages.filter((m) => m.status === "processing").length}
          </p>
        </div>
      
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Enviadas</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {messages.filter((m) => m.status === "sent").length}
          </p>
        </div>
      
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Erros</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {messages.filter((m) => m.status === "error").length}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        {/* criação */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-white">
            Nova campanha
          </h2>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-[11px] text-[#E5E7EB] mb-1">
                Nome da campanha
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Aproximação professores"
                className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#E5E7EB] mb-1">
                Canal
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as CampaignChannel)}
                className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
              >
                <option value="instagram_dm">Instagram DM</option>
                <option value="facebook_dm">Facebook DM</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <select
              value={temperature}
              onChange={(e) =>
                setTemperature(
                  e.target.value as "all" | "cold" | "warm" | "hot" | "priority",
                )
              }
              className="rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
            >
              <option value="all">Todas as temperaturas</option>
              <option value="cold">Frio</option>
              <option value="warm">Morno</option>
              <option value="hot">Quente</option>
              <option value="priority">Prioridade</option>
            </select>

            <select
              value={followStatus}
              onChange={(e) =>
                setFollowStatus(
                  e.target.value as "all" | "followers" | "non_followers",
                )
              }
              className="rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
            >
              <option value="all">Todos</option>
              <option value="followers">Já seguem</option>
              <option value="non_followers">Não seguem</option>
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
            >
              <option value="all">Todas as categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={operationalTag}
              onChange={(e) => setOperationalTag(e.target.value)}
              className="rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
            >
              <option value="all">Todas as tags</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca livre..."
              className="xl:col-span-2 rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#E5E7EB] mb-1">
              Mensagem
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Use variáveis como {{nome}}, {{nome_completo}} e {{usuario}}"
              className="min-h-[180px] w-full rounded-2xl border border-[#272046] bg-[#020012] p-3 text-sm text-white"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#272046] bg-[#020012] p-4">
            <div>
              <p className="text-sm font-medium text-white">
                Público estimado
              </p>
              <p className="text-xs text-[#9CA3AF]">
                O sistema aplicará limite de segurança no disparo, se necessário.
              </p>
            </div>

            <span className="text-2xl font-semibold text-white">
              {loading ? "..." : previewRecipients.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleDispatch}
            disabled={dispatching}
            className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {dispatching ? "Disparando..." : "Criar e disparar campanha"}
          </button>
        </div>

        {/* preview */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <h2 className="text-sm font-semibold text-white mb-4">
            Preview da lista
          </h2>

          <div className="flex flex-col gap-3 max-h-[620px] overflow-auto pr-1">
            {previewRecipients.slice(0, 20).map((profile) => (
              <div
                key={profile.id}
                className="rounded-xl border border-[#272046] bg-[#020012] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-white font-medium">
                      {profile.name}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      {profile.username}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-1 rounded-full ${getStatusClass(
                      profile.leadTemperature === "priority"
                        ? "error"
                        : profile.leadTemperature === "hot"
                        ? "processing"
                        : profile.leadTemperature === "warm"
                        ? "queued"
                        : "done",
                    )}`}
                  >
                    {profile.leadTemperature}
                  </span>
                </div>

                {(profile.operationalTags || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.operationalTags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#111827] px-2 py-1 text-[10px] text-[#E5E7EB]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {previewRecipients.length > 20 && (
              <p className="text-xs text-[#9CA3AF]">
                Exibindo 20 de {previewRecipients.length} perfis.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* histórico */}
      <section className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
        <h2 className="text-sm font-semibold text-white mb-4">
          Campanhas recentes
        </h2>

        <div className="flex flex-col gap-3">
          {campaigns.length === 0 && (
            <p className="text-sm text-[#9CA3AF]">
              Nenhuma campanha criada ainda.
            </p>
          )}

            {campaigns.map((campaign) => {
              const campaignMessages = messages.filter(
                (m) => m.campaignId === campaign.id,
              );
            
              const queued = campaignMessages.filter((m) => m.status === "queued").length;
              const processing = campaignMessages.filter((m) => m.status === "processing").length;
              const sent = campaignMessages.filter((m) => m.status === "sent").length;
              const error = campaignMessages.filter((m) => m.status === "error").length;
            
              return (
                <div
                  key={campaign.id}
                  className="rounded-xl border border-[#272046] bg-[#020012] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        Canal: {campaign.channel} • Destinatários: {campaign.recipientsCount}
                      </p>
                    </div>
            
                    <span
                      className={`text-[10px] px-3 py-1 rounded-full ${getStatusClass(
                        campaign.status,
                      )}`}
                    >
                      {campaign.status}
                    </span>
                  </div>
            
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-lg bg-[#111827] px-2 py-2">
                      <p className="text-[10px] text-[#9CA3AF]">Fila</p>
                      <p className="text-sm text-white">{queued}</p>
                    </div>
                    <div className="rounded-lg bg-[#111827] px-2 py-2">
                      <p className="text-[10px] text-[#9CA3AF]">Proc.</p>
                      <p className="text-sm text-white">{processing}</p>
                    </div>
                    <div className="rounded-lg bg-[#111827] px-2 py-2">
                      <p className="text-[10px] text-[#9CA3AF]">Enviadas</p>
                      <p className="text-sm text-white">{sent}</p>
                    </div>
                    <div className="rounded-lg bg-[#111827] px-2 py-2">
                      <p className="text-[10px] text-[#9CA3AF]">Erros</p>
                      <p className="text-sm text-white">{error}</p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}
