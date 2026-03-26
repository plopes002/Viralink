// src/app/(app)/perfis/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useEngagementProfiles } from "@/hooks/useEngagementProfiles";
import type { EngagementProfile } from "@/types/engagementProfile";
import { importProfileToContact } from "@/lib/importProfileToContact";
import { useFirebase } from "@/firebase/provider";

type TemperatureFilter = "all" | "cold" | "warm" | "hot" | "priority";
type FollowFilter = "all" | "followers" | "non_followers";

function getTemperatureLabel(temp?: string) {
  if (temp === "priority") return "Prioridade";
  if (temp === "hot") return "Quente";
  if (temp === "warm") return "Morno";
  return "Frio";
}

function getTemperatureClass(temp?: string) {
  if (temp === "priority") return "bg-fuchsia-500/15 text-fuchsia-400";
  if (temp === "hot") return "bg-rose-500/15 text-rose-400";
  if (temp === "warm") return "bg-amber-500/15 text-amber-400";
  return "bg-slate-500/15 text-slate-300";
}

export default function PerfisConsolidadosPage() {
  const { currentWorkspace } = useWorkspace() as any;
  const { firestore } = useFirebase();
  const workspaceId = currentWorkspace?.id;

  const { profiles, loading } = useEngagementProfiles(workspaceId);

  const [selectedProfile, setSelectedProfile] =
    useState<EngagementProfile | null>(null);

  const [search, setSearch] = useState("");
  const [temperatureFilter, setTemperatureFilter] =
    useState<TemperatureFilter>("all");
  const [followFilter, setFollowFilter] =
    useState<FollowFilter>("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [importingOneId, setImportingOneId] = useState<string | null>(null);
  const [importingBatch, setImportingBatch] = useState(false);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    profiles.forEach((profile) => {
      (profile.operationalTags || []).forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
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

      if (search.trim() && !haystack.includes(search.trim().toLowerCase())) {
        return false;
      }

      if (
        temperatureFilter !== "all" &&
        profile.leadTemperature !== temperatureFilter
      ) {
        return false;
      }

      if (followFilter === "followers" && !profile.isFollower) {
        return false;
      }

      if (followFilter === "non_followers" && profile.isFollower) {
        return false;
      }

      if (
        tagFilter !== "all" &&
        !(profile.operationalTags || []).includes(tagFilter)
      ) {
        return false;
      }

      return true;
    });
  }, [profiles, search, temperatureFilter, followFilter, tagFilter]);

  function openWhatsApp(profile: EngagementProfile) {
    if (!profile.phone) return;

    const digits = profile.phone.replace(/\D/g, "");
    const text = encodeURIComponent(
      `Olá ${profile.name.split(" ")[0]}! Tudo bem? Estou entrando em contato porque percebemos seu interesse em nossos conteúdos e gostaríamos de continuar essa conversa por aqui 😊`,
    );

    window.open(`https://wa.me/${digits}?text=${text}`, "_blank");
  }

  async function exportProfilesXlsx() {
    if (!workspaceId) return;
    window.open(
      `/api/engagement/profiles/export/xlsx?workspaceId=${workspaceId}`,
      "_blank",
    );
  }

  async function exportProfilesPdf() {
    if (!workspaceId) return;
    window.open(
      `/api/engagement/profiles/export/pdf?workspaceId=${workspaceId}`,
      "_blank",
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">
            Perfis Consolidados
          </h1>
          <p className="text-sm text-[#9CA3AF]">
            Veja cada pessoa como um perfil completo, com score histórico,
            temperatura, recorrência e potencial de ação.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            disabled={importingBatch || filteredProfiles.length === 0}
            onClick={async () => {
              if (!firestore) return;
              setImportingBatch(true);
              try {
                for (const profile of filteredProfiles) {
                  await importProfileToContact(firestore, profile);
                }
                alert(
                  `${filteredProfiles.length} perfil(is) foram adicionados ao CRM.`,
                );
              } finally {
                setImportingBatch(false);
              }
            }}
            className="rounded-xl border border-[#272046] px-4 py-2 text-sm text-white hover:bg-[#111827] disabled:opacity-60"
          >
            {importingBatch ? "Importando..." : "Adicionar filtrados ao CRM"}
          </button>

          <button
            type="button"
            onClick={exportProfilesXlsx}
            className="rounded-xl border border-[#272046] px-4 py-2 text-sm text-white hover:bg-[#111827]"
          >
            Exportar XLSX
          </button>

          <button
            type="button"
            onClick={exportProfilesPdf}
            className="rounded-xl border border-[#272046] px-4 py-2 text-sm text-white hover:bg-[#111827]"
          >
            Exportar PDF
          </button>
        </div>
      </header>

      {/* filtros */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <label className="block text-[11px] text-[#E5E7EB] mb-1">
            Busca
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome, usuário, tag, tema..."
            className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-[12px] text-white"
          />
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <label className="block text-[11px] text-[#E5E7EB] mb-1">
            Temperatura
          </label>
          <select
            value={temperatureFilter}
            onChange={(e) =>
              setTemperatureFilter(
                e.target.value as "all" | "cold" | "warm" | "hot" | "priority",
              )
            }
            className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-[12px] text-white"
          >
            <option value="all">Todas</option>
            <option value="cold">Frio</option>
            <option value="warm">Morno</option>
            <option value="hot">Quente</option>
            <option value="priority">Prioridade</option>
          </select>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <label className="block text-[11px] text-[#E5E7EB] mb-1">
            Seguimento
          </label>
          <select
            value={followFilter}
            onChange={(e) =>
              setFollowFilter(
                e.target.value as "all" | "followers" | "non_followers",
              )
            }
            className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-[12px] text-white"
          >
            <option value="all">Todos</option>
            <option value="followers">Já seguem</option>
            <option value="non_followers">Não seguem</option>
          </select>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <label className="block text-[11px] text-[#E5E7EB] mb-1">
            Tag operacional
          </label>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-[12px] text-white"
          >
            <option value="all">Todas</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* lista */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">
              Lista consolidada
            </h2>
            <span className="text-xs text-[#9CA3AF]">
              {loading ? "Carregando..." : `${filteredProfiles.length} perfil(is)`}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {!loading && filteredProfiles.length === 0 && (
              <p className="text-sm text-[#9CA3AF]">
                Nenhum perfil encontrado com esses filtros.
              </p>
            )}

            {filteredProfiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => setSelectedProfile(profile)}
                className={`text-left rounded-2xl border p-4 transition ${
                  selectedProfile?.id === profile.id
                    ? "border-[#8B5CF6] bg-[#111827]"
                    : "border-[#272046] bg-[#020012] hover:bg-[#0B1120]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {profile.name}{" "}
                      <span className="text-[#9CA3AF] font-normal">
                        ({profile.username})
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      {profile.isFollower
                        ? "Já segue o perfil"
                        : "Não segue o perfil"}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full ${getTemperatureClass(
                        profile.leadTemperature,
                      )}`}
                    >
                      {getTemperatureLabel(profile.leadTemperature)}
                    </span>

                    <span className="text-xs text-white font-medium">
                      Score {profile.leadScore ?? 0}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <div>
                    <p className="text-[11px] text-[#7D8590]">Interações</p>
                    <p className="text-xs text-white">
                      {profile.totalInteractions}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-[#7D8590]">Mensagens</p>
                    <p className="text-xs text-white">
                      {profile.totalMessages}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-[#7D8590]">Temas</p>
                    <p className="text-xs text-white">
                      {profile.distinctTopicsCount}
                    </p>
                  </div>
                </div>

                {(profile.operationalTags || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.operationalTags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#06B6D4]/20 px-2 py-1 text-[10px] text-white"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!firestore) return;
                    setImportingOneId(profile.id);
                    try {
                      await importProfileToContact(firestore, profile);
                      alert(`${profile.name} foi adicionado ao CRM.`);
                    } finally {
                      setImportingOneId(null);
                    }
                  }}
                  className="mt-3 rounded-lg border border-[#272046] px-3 py-1.5 text-[11px] text-white hover:bg-[#111827]"
                >
                  {importingOneId === profile.id ? "Adicionando..." : "Adicionar ao CRM"}
                </button>
              </button>
            ))}
          </div>
        </div>

        {/* painel lateral */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <h2 className="text-sm font-semibold text-white mb-4">
            Perfil detalhado
          </h2>

          {!selectedProfile ? (
            <p className="text-sm text-[#9CA3AF]">
              Selecione um perfil da lista para ver detalhes.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                <p className="text-lg font-semibold text-white">
                  {selectedProfile.name}
                </p>
                <p className="text-sm text-[#9CA3AF]">
                  {selectedProfile.username}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`text-[10px] px-3 py-1 rounded-full ${getTemperatureClass(
                      selectedProfile.leadTemperature,
                    )}`}
                  >
                    {getTemperatureLabel(selectedProfile.leadTemperature)}
                  </span>

                  <span className="text-[10px] px-3 py-1 rounded-full bg-sky-500/15 text-sky-400">
                    Score {selectedProfile.leadScore ?? 0}
                  </span>

                  <span className="text-[10px] px-3 py-1 rounded-full bg-[#111827] text-[#E5E7EB]">
                    {selectedProfile.isFollower ? "Seguidor" : "Não segue"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                <p className="text-[11px] text-[#7D8590] mb-2">
                  Resumo histórico
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[#9CA3AF]">Total interações</p>
                    <p className="text-white font-medium">
                      {selectedProfile.totalInteractions}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">Mensagens</p>
                    <p className="text-white font-medium">
                      {selectedProfile.totalMessages}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">Comentários</p>
                    <p className="text-white font-medium">
                      {selectedProfile.totalComments}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">Compartilhamentos</p>
                    <p className="text-white font-medium">
                      {selectedProfile.totalShares}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">Posts distintos</p>
                    <p className="text-white font-medium">
                      {selectedProfile.distinctPostsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">Temas distintos</p>
                    <p className="text-white font-medium">
                      {selectedProfile.distinctTopicsCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                <p className="text-[11px] text-[#7D8590] mb-2">
                  Motivos do score
                </p>

                {(selectedProfile.leadScoreReason || []).length === 0 ? (
                  <p className="text-xs text-[#9CA3AF]">
                    Nenhum motivo calculado.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedProfile.leadScoreReason?.map((reason, idx) => (
                      <p key={idx} className="text-xs text-[#C7CAD1]">
                        • {reason}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {(selectedProfile.categories || []).length > 0 && (
                <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                  <p className="text-[11px] text-[#7D8590] mb-2">
                    Categorias
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.categories?.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-[#8B5CF6]/20 px-3 py-1 text-xs text-white"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(selectedProfile.operationalTags || []).length > 0 && (
                <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                  <p className="text-[11px] text-[#7D8590] mb-2">
                    Tags operacionais
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.operationalTags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#06B6D4]/20 px-3 py-1 text-xs text-white"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(selectedProfile.politicalEntities || []).length > 0 && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="text-[11px] text-amber-300 mb-2">
                    Menções políticas detectadas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.politicalEntities?.map((entity) => (
                      <span
                        key={entity}
                        className="rounded-full bg-[#111827] px-3 py-1 text-xs text-[#E5E7EB]"
                      >
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedProfile || !firestore) return;

                    setImportingOneId(selectedProfile.id);
                    try {
                      await importProfileToContact(firestore, selectedProfile);
                      alert(`${selectedProfile.name} foi adicionado ao CRM.`);
                    } finally {
                      setImportingOneId(null);
                    }
                  }}
                  className="rounded-xl border border-[#272046] px-4 py-3 text-sm font-medium text-white hover:bg-[#111827]"
                >
                  {importingOneId === selectedProfile.id
                    ? "Adicionando ao CRM..."
                    : "Adicionar ao CRM"}
                </button>
                
                {selectedProfile.phone && (
                  <button
                    type="button"
                    onClick={() => openWhatsApp(selectedProfile)}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400"
                  >
                    Abrir no WhatsApp
                  </button>
                )}

                <button
                  type="button"
                  className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-3 text-sm font-medium text-white"
                >
                  Criar ação para este perfil
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
