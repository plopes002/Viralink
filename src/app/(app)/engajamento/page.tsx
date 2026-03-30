"use client";

import { useMemo, useState, useEffect } from "react";
import type {
  EngagementInteractionType,
  EngagementItem,
  EngagementSentiment,
} from "@/types/engagement";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useEngagements } from "@/hooks/useEngagements";
import { useContactCategories } from "@/hooks/useContactCategories";
import { createContactCategory } from "@/firebase/contactCategories";
import {
  addCategoryToEngagement,
  removeCategoryFromEngagement,
} from "@/firebase/engagementCategories";
import { useFirebase } from "@/firebase/provider";
import { suggestAndSaveCategories } from "@/lib/suggestAndSaveCategories";
import { matchesSmartSearch } from "@/lib/engagementSearch";
import { analyzePoliticalReviewAndSave } from "@/lib/analyzePoliticalReview";
import {
  addOperationalTag,
  removeOperationalTag,
} from "@/firebase/engagementOperationalTags";
import { OPERATIONAL_TAGS } from "@/constants/operationalTags";
import { updateLeadScoreForEngagement } from "@/lib/updateLeadScore";

type SentimentFilter = "all" | EngagementSentiment;
type InteractionFilter = "all" | EngagementInteractionType;
type FollowFilter = "all" | "followers" | "non_followers";

export default function EngagementPage() {
  const [selectedUser, setSelectedUser] = useState<EngagementItem | null>(null);
  const [message, setMessage] = useState("");
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { engagements, loading } = useEngagements(workspaceId);
  useEffect(() => {
    if (!selectedUser) return;
  
    const updated = engagements.find((item) => item.id === selectedUser.id);
    if (updated) {
      setSelectedUser(updated);
    }
  }, [engagements, selectedUser]);


  const { firestore } = useFirebase();
  

  
  const { categories } = useContactCategories(workspaceId);

  const [sentimentFilter, setSentimentFilter] =
    useState<SentimentFilter>("all");
  const [interactionFilter, setInteractionFilter] =
    useState<InteractionFilter>("all");
  const [followFilter, setFollowFilter] =
    useState<FollowFilter>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [smartSearch, setSmartSearch] = useState("");
  const [taggingOneId, setTaggingOneId] = useState<string | null>(null);
  const [taggingAll, setTaggingAll] = useState(false);
  const [operationalTagFilter, setOperationalTagFilter] = useState("all");
  const [scoringOneId, setScoringOneId] = useState<string | null>(null);
  const [scoringAll, setScoringAll] = useState(false);
  const [temperatureFilter, setTemperatureFilter] = useState<
    "all" | "cold" | "warm" | "hot" | "priority"
  >("all");

  const topics = useMemo(() => {
    const values = Array.from(
      new Set(engagements.map((e) => e.postTopic).filter(Boolean)),
    ) as string[];
    return values;
  }, [engagements]);

  const filtered = useMemo(() => {
    return engagements.filter((item) => {
      if (
        sentimentFilter !== "all" &&
        item.interactionSentiment !== sentimentFilter
      ) {
        return false;
      }

      if (
        interactionFilter !== "all" &&
        item.interactionType !== interactionFilter
      ) {
        return false;
      }

      if (followFilter === "followers" && !item.isFollower) {
        return false;
      }

      if (followFilter === "non_followers" && item.isFollower) {
        return false;
      }

      if (topicFilter !== "all" && item.postTopic !== topicFilter) {
        return false;
      }

      if (
        categoryFilter !== "all" &&
        !(item.categories || []).includes(categoryFilter)
      ) {
        return false;
      }

      if (
        operationalTagFilter !== "all" &&
        !(item.operationalTags || []).includes(operationalTagFilter)
      ) {
        return false;
      }

      if (
        temperatureFilter !== "all" &&
        item.leadTemperature !== temperatureFilter
      ) {
        return false;
      }

      if (!matchesSmartSearch(item, smartSearch)) {
        return false;
      }

      return true;
    });
  }, [engagements, sentimentFilter, interactionFilter, followFilter, topicFilter, categoryFilter, smartSearch, operationalTagFilter, temperatureFilter]);

  function getSentimentLabel(sentiment: EngagementSentiment) {
    if (sentiment === "positive") return "Positivo";
    if (sentiment === "negative") return "Negativo";
    return "Neutro";
  }

  function getSentimentClass(sentiment: EngagementSentiment) {
    if (sentiment === "positive") {
      return "bg-emerald-500/15 text-emerald-400";
    }
    if (sentiment === "negative") {
      return "bg-rose-500/15 text-rose-400";
    }
    return "bg-slate-500/15 text-slate-300";
  }

  function getInteractionLabel(type: EngagementInteractionType) {
    const map: Record<EngagementInteractionType, string> = {
      view: "Visualização",
      like: "Curtida",
      comment: "Comentário",
      reaction: "Reação",
      share: "Compartilhamento",
      message: "Mensagem",
    };
    return map[type];
  }

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


  async function sendMessage() {
  if (!workspaceId || !selectedUser || !message.trim()) return;

  try {
    const res = await fetch("/api/engagement/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId,
        engagementId: selectedUser.id,
        username: selectedUser.username,
        phone: selectedUser.phone || null,
        network: selectedUser.network,
        source: selectedUser.source,
        message: message.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "Erro ao enviar mensagem.");
      return;
    }

    alert(`Mensagem enviada para @${selectedUser.username}`);
    setMessage("");
  } catch (error) {
    console.error("[EngagementPage] erro ao enviar mensagem:", error);
    alert("Erro ao enviar mensagem.");
  }
}

  function fillSuggestedMessage(user: EngagementItem) {
    if (user.interactionSentiment === "positive" && !user.isFollower) {
      setMessage(
        `Oi ${user.name.split(" ")[0]}! Vi que você interagiu com nosso conteúdo "${user.postTitle}". Que bom que chamou sua atenção 💜 Se curtiu, aproveita para seguir a página porque sempre publicamos conteúdos relevantes por aqui.`,
      );
      return;
    }

    if (user.interactionType === "comment" && user.interactionSentiment === "negative") {
      setMessage(
        `Oi ${user.name.split(" ")[0]}! Vi seu comentário no post "${user.postTitle}" e queria entender melhor seu ponto de vista. Seu feedback é importante para melhorarmos nossos conteúdos.`,
      );
      return;
    }

    setMessage(
      `Oi ${user.name.split(" ")[0]}! Vi sua interação no conteúdo "${user.postTitle}". Gostou desse tema? Se fizer sentido para você, aproveita para seguir a página — sempre compartilhamos conteúdos relevantes por aqui.`,
    );
  }

  function openWhatsAppForUser(user: EngagementItem) {
    if (!user.phone) return;

    const text = encodeURIComponent(
      `Olá ${user.name.split(" ")[0]}! Vi sua interação com nosso conteúdo "${user.postTitle}". Gostaria de continuar essa conversa por aqui 😊`,
    );

    const digits = user.phone.replace(/\D/g, "");
    const url = `https://wa.me/${digits}?text=${text}`;

    window.open(url, "_blank");
  }

  async function handleCreateCategory() {
    if (!workspaceId || !newCategoryName.trim() || !firestore) return;

    const slug = newCategoryName
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");

    await createContactCategory(firestore, {
      workspaceId,
      name: newCategoryName.trim(),
      slug,
      color: null,
      createdAt: new Date().toISOString(),
    });

    setNewCategoryName("");
  }

  async function sendToFiltered() {
    if (!workspaceId || !bulkMessage.trim()) return;
  
    const users = filtered;
    if (!users.length) {
      alert("Nenhum usuário na lista filtrada para enviar.");
      return;
    }
  
    setBulkSending(true);
    try {
      const res = await fetch("/api/engagement/send-bulk-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          users: users.map((u) => ({
            engagementId: u.id,
            username: u.username,
            phone: u.phone || null,
            network: u.network,
            source: u.source,
          })),
          message: bulkMessage.trim(),
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        alert(data?.error || "Erro ao disparar mensagens.");
        return;
      }
  
      alert(`Mensagens enfileiradas para ${data.queued || users.length} usuários.`);
      setBulkMessage("");
    } catch (error) {
      console.error("[EngagementPage] erro ao enviar em massa:", error);
      alert("Erro ao disparar mensagens.");
    } finally {
      setBulkSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Engajamento</h1>
          <p className="text-sm text-[#9CA3AF]">
            Veja quem interagiu, com qual conteúdo, o sentimento da interação e envie mensagens personalizadas.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/engagement/export/xlsx?workspaceId=${workspaceId}`}
            className="rounded-xl border border-[#272046] px-4 py-2 text-sm text-white hover:bg-[#111827]"
          >
            Exportar XLSX
          </a>
        
          <a
            href={`/api/engagement/export/pdf?workspaceId=${workspaceId}`}
            className="rounded-xl border border-[#272046] px-4 py-2 text-sm text-white hover:bg-[#111827]"
          >
            Exportar PDF
          </a>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <h2 className="text-sm font-semibold text-white mb-3">
            Categorias de contatos
          </h2>

          <div className="flex gap-2">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ex.: Professores"
              className="flex-1 rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={handleCreateCategory}
              className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-2 text-sm font-medium text-white"
            >
              Criar
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`rounded-full px-3 py-1 text-xs ${
                categoryFilter === "all"
                  ? "bg-[#8B5CF6]/20 text-white"
                  : "bg-[#111827] text-[#9CA3AF]"
              }`}
            >
              Todas
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.slug)}
                className={`rounded-full px-3 py-1 text-xs ${
                  categoryFilter === cat.slug
                    ? "bg-[#8B5CF6]/20 text-white"
                    : "bg-[#111827] text-[#9CA3AF]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <h2 className="text-sm font-semibold text-white mb-3">
            Disparo para lista filtrada
          </h2>

          <div className="flex flex-col gap-3">
            <textarea
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
              placeholder="Digite a mensagem para a lista de contatos filtrada..."
              className="min-h-[120px] rounded-xl border border-[#272046] bg-[#020012] p-3 text-sm text-white"
            />

            <button
              type="button"
              onClick={sendToFiltered}
              disabled={bulkSending}
              className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {bulkSending ? "Enviando..." : "Enviar para lista"}
            </button>
          </div>
        </div>
      </section>

      {/* filtros */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
        <label className="block text-[11px] text-[#E5E7EB] mb-1">
          Tipo de interação
        </label>
        <select
          value={interactionFilter}
          onChange={(e) =>
            setInteractionFilter(e.target.value as InteractionFilter)
          }
          className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-2"
        >
          <option value="all">Todas</option>
          <option value="view">Visualização</option>
          <option value="like">Curtida</option>
          <option value="comment">Comentário</option>
          <option value="reaction">Reação</option>
          <option value="share">Compartilhamento</option>
          <option value="message">Mensagem</option>
        </select>
      </div>
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <label className="block text-[11px] text-[#E5E7EB] mb-1">
            Busca inteligente
          </label>
          <input
            value={smartSearch}
            onChange={(e) => setSmartSearch(e.target.value)}
            placeholder="Ex.: professores, fitness..."
            className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-[12px] text-white"
          />
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <label className="block text-[11px] text-[#E5E7EB] mb-1">
            Temperatura do lead
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
            Seguidores
          </label>
          <select
            value={sentimentFilter}
            onChange={(e) =>
              setSentimentFilter(e.target.value as SentimentFilter)
            }
            className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-2"
          >
            <option value="all">Todos</option>
            <option value="positive">Positivo</option>
            <option value="neutral">Neutro</option>
            <option value="negative">Negativo</option>
          </select>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <label className="block text-[11px] text-[#E5E7EB] mb-1">
            Tag operacional
          </label>

          <select
            value={operationalTagFilter}
            onChange={(e) => setOperationalTagFilter(e.target.value)}
            className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
          >
            <option value="all">Todas</option>

            {OPERATIONAL_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <label className="block text-[11px] text-[#E5E7EB] mb-1">
            Seguimento
          </label>
          <select
            value={followFilter}
            onChange={(e) => setFollowFilter(e.target.value as FollowFilter)}
            className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-2"
          >
            <option value="all">Todos</option>
            <option value="followers">Já seguem</option>
            <option value="non_followers">Não seguem</option>
          </select>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <label className="block text-[11px] text-[#E5E7EB] mb-1">
            Tema do conteúdo
          </label>
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="w-full rounded-xl border border-[#272046] bg-[#020012] text-[12px] text-[#E5E7EB] px-3 py-2"
          >
            <option value="all">Todos</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={taggingAll || filtered.length === 0}
          onClick={async () => {
            if (!firestore) return;
            setTaggingAll(true);
            try {
              for (const item of filtered) {
                await suggestAndSaveCategories(firestore, item);
              }
              alert("Sugestão automática de categorias concluída para os itens filtrados.");
            } finally {
              setTaggingAll(false);
            }
          }}
          className="rounded-xl border border-[#272046] px-4 py-2 text-sm text-white hover:bg-[#111827] disabled:opacity-60"
        >
          {taggingAll ? "Classificando..." : `Sugerir categorias para ${filtered.length} iten(s)`}
        </button>
        <button
          type="button"
          disabled={scoringAll || filtered.length === 0}
          onClick={async () => {
            if (!firestore) return;
            setScoringAll(true);
            try {
              for (const item of filtered) {
                await updateLeadScoreForEngagement(firestore, item);
              }
              alert("Lead scoring atualizado para a lista filtrada.");
            } finally {
              setScoringAll(false);
            }
          }}
          className="rounded-xl border border-[#272046] px-4 py-2 text-sm text-white hover:bg-[#111827] disabled:opacity-60"
        >
          {scoringAll ? "Calculando scores..." : "Atualizar lead scoring"}
        </button>
      </div>
      
      {loading && (
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-sm text-[#9CA3AF]">Carregando engajamentos...</p>
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* lista */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">
              Lista de engajamento
            </h2>
            <span className="text-xs text-[#9CA3AF]">
              {filtered.length} registro(s)
            </span>
          </div>

          <div className="flex flex-col gap-3">
          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#272046] bg-[#020012] p-6 text-center">
              <p className="text-sm text-white">Nenhum engajamento encontrado</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                Ajuste os filtros ou verifique se já existem interações salvas para este workspace.
              </p>
            </div>
          )}
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedUser(item)}
                className={`text-left rounded-2xl border p-4 transition ${
                  selectedUser?.id === item.id
                    ? "border-[#8B5CF6] bg-[#111827]"
                    : "border-[#272046] bg-[#020012] hover:bg-[#0B1120]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {item.name}{" "}
                      <span className="text-[#9CA3AF] font-normal">
                        ({item.username})
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      {item.isFollower ? "Já segue o perfil" : "Não segue o perfil"}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full ${getSentimentClass(
                        item.interactionSentiment,
                      )}`}
                    >
                      {getSentimentLabel(item.interactionSentiment)}
                    </span>
                    {item.leadTemperature && (
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full ${getTemperatureClass(
                          item.leadTemperature,
                        )}`}
                      >
                        {getTemperatureLabel(item.leadTemperature)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] text-[#7D8590]">Conteúdo</p>
                    <p className="text-xs text-white">
                      {item.postTitle || "Sem post vinculado"}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {item.postType || "-"} • {item.postTopic || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-[#7D8590]">Interação</p>
                    <p className="text-xs text-white">
                      {getInteractionLabel(item.interactionType)}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      Origem: {item.source} • Rede: {item.network}
                    </p>
                  </div>
                </div>

                {item.interactionText && (
                  <div className="mt-3 rounded-xl bg-[#0B1120] px-3 py-2">
                    <p className="text-[11px] text-[#7D8590] mb-1">
                      Texto da interação
                    </p>
                    <p className="text-xs text-[#E5E7EB]">
                      {item.interactionText}
                    </p>
                  </div>
                )}
                 <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!firestore) return;
                      setTaggingOneId(item.id);
                      try {
                        const cats = await suggestAndSaveCategories(firestore, item);
                        if (cats.length) {
                          alert(`Categorias sugeridas: ${cats.join(", ")}`);
                        } else {
                          alert("Nenhuma categoria sugerida com confiança.");
                        }
                      } finally {
                        setTaggingOneId(null);
                      }
                    }}
                    className="rounded-lg border border-[#272046] px-3 py-1.5 text-[11px] text-[#E5E7EB] hover:bg-[#111827]"
                    disabled={taggingOneId === item.id}
                  >
                    {taggingOneId === item.id ? "Analisando..." : "Sugerir categorias com IA"}
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                        e.stopPropagation();
                        if (!firestore) return;
                        const result = await analyzePoliticalReviewAndSave(firestore, item);
                        if (result?.hasPoliticalMention) {
                          alert("Texto político sinalizado para revisão manual.");
                        } else {
                          alert("Sem menções políticas claras.");
                        }
                    }}
                    className="rounded-lg border border-[#272046] px-3 py-1.5 text-[11px] text-[#E5E7EB] hover:bg-[#111827]"
                  >
                    Revisar menções políticas
                  </button>
                </div>
                
                {typeof item.leadScore === "number" && (
                  <p className="mt-2 text-[11px] text-[#9CA3AF]">
                    Score: <span className="text-white font-medium">{item.leadScore}</span>
                  </p>
                )}


                 {item.politicalReview?.hasPoliticalMention && (
                  <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                    <p className="text-[11px] text-amber-300 font-medium">
                      Texto político detectado
                    </p>

                    {item.politicalReview.summary && (
                      <p className="mt-1 text-xs text-[#E5E7EB]">
                        {item.politicalReview.summary}
                      </p>
                    )}

                    {(item.politicalReview.entities || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.politicalReview.entities.map((entity) => (
                          <span
                            key={entity}
                            className="rounded-full bg-[#111827] px-2 py-1 text-[10px] text-[#E5E7EB]"
                          >
                            {entity}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.politicalReview.excerpt && (
                      <p className="mt-2 text-[11px] text-[#C7CAD1]">
                        Trecho: “{item.politicalReview.excerpt}”
                      </p>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* painel lateral */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <h2 className="text-sm font-semibold text-white mb-4">
            Ação comercial
          </h2>

          {!selectedUser ? (
            <p className="text-xs text-[#9CA3AF]">
              Selecione uma pessoa da lista para ver detalhes e enviar uma mensagem.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                <p className="text-sm font-medium text-white">
                  {selectedUser.name}
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  {selectedUser.username}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-sky-500/15 text-sky-400">
                    {selectedUser.isFollower ? "Seguidor" : "Não segue"}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full ${getSentimentClass(
                      selectedUser.interactionSentiment,
                    )}`}
                  >
                    {getSentimentLabel(selectedUser.interactionSentiment)}
                  </span>
                </div>
              </div>
              
              <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] text-[#7D8590]">Lead Scoring</p>
                    <p className="text-xl font-semibold text-white">
                      {selectedUser.leadScore ?? 0}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] px-3 py-1 rounded-full ${getTemperatureClass(
                      selectedUser.leadTemperature,
                    )}`}
                  >
                    {getTemperatureLabel(selectedUser.leadTemperature)}
                  </span>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  {(selectedUser.leadScoreReason || []).length === 0 ? (
                    <p className="text-xs text-[#9CA3AF]">
                      Score ainda não calculado.
                    </p>
                  ) : (
                    selectedUser.leadScoreReason?.map((reason, idx) => (
                      <p key={idx} className="text-xs text-[#C7CAD1]">
                        • {reason}
                      </p>
                    ))
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!firestore) return;
                      setScoringOneId(selectedUser.id);
                      try {
                        const result = await updateLeadScoreForEngagement(firestore, selectedUser);
                        alert(
                          `Score atualizado: ${result.score} (${getTemperatureLabel(
                            result.temperature,
                          )})`,
                        );
                      } finally {
                        setScoringOneId(null);
                      }
                    }}
                    className="rounded-xl border border-[#272046] px-4 py-2 text-xs text-white hover:bg-[#111827]"
                  >
                    {scoringOneId === selectedUser.id ? "Calculando..." : "Recalcular score"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                <p className="text-[11px] text-[#7D8590] mb-2">Categorias</p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {(selectedUser.categories || []).length === 0 && (
                    <span className="text-xs text-[#9CA3AF]">
                      Nenhuma categoria atribuída.
                    </span>
                  )}

                  {(selectedUser.categories || []).map((slug) => (
                    <span
                      key={slug}
                      className="rounded-full bg-[#8B5CF6]/20 px-3 py-1 text-xs text-white"
                    >
                      {categories.find(c => c.slug === slug)?.name || slug}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const alreadyHas = (selectedUser.categories || []).includes(cat.slug);

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={async () => {
                          if (!firestore) return;
                        
                          try {
                            if (alreadyHas) {
                              await removeCategoryFromEngagement(firestore, selectedUser.id, cat.slug);
                            } else {
                              await addCategoryToEngagement(firestore, selectedUser.id, cat.slug);
                            }
                          } catch (error) {
                            console.error("[EngagementPage] erro ao atualizar categoria:", error);
                            alert("Erro ao atualizar categoria.");
                          }
                        }}
                      >
                        {alreadyHas ? `Remover ${cat.name}` : `Adicionar ${cat.name}`}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                <p className="text-[11px] text-[#7D8590] mb-2">
                  Tags operacionais
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(selectedUser.operationalTags || []).length === 0 && (
                    <span className="text-xs text-[#9CA3AF]">
                      Nenhuma tag aplicada
                    </span>
                  )}
                  {(selectedUser.operationalTags || []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#06B6D4]/20 px-3 py-1 text-xs text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {OPERATIONAL_TAGS.map((tag) => {
                    const hasTag = (selectedUser.operationalTags || []).includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={async () => {
                          if (!firestore) return;
                        
                          try {
                            if (hasTag) {
                              await removeOperationalTag(firestore, selectedUser.id, tag);
                            } else {
                              await addOperationalTag(firestore, selectedUser.id, tag);
                            }
                          } catch (error) {
                            console.error("[EngagementPage] erro ao atualizar tag operacional:", error);
                            alert("Erro ao atualizar tag.");
                          }
                        }}
                        className={`rounded-full px-3 py-1 text-xs ${
                          hasTag
                            ? "bg-rose-500/15 text-rose-400"
                            : "bg-[#111827] text-[#E5E7EB]"
                        }`}
                      >
                        {hasTag ? `Remover ${tag}` : tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                <p className="text-[11px] text-[#7D8590]">Interesse percebido</p>
                <p className="text-sm text-white mt-1">
                  Conteúdo: {selectedUser.postTitle}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Tema: {selectedUser.postTopic} • Tipo: {selectedUser.postType}
                </p>
              </div>

              {selectedUser.phone && (
                <button
                  type="button"
                  onClick={() => openWhatsAppForUser(selectedUser)}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400"
                >
                  Abrir no WhatsApp
                </button>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fillSuggestedMessage(selectedUser)}
                  className="flex-1 rounded-xl border border-[#272046] text-xs text-[#E5E7EB] py-2 hover:bg-[#111827]"
                >
                  Gerar mensagem sugerida
                </button>
              </div>

              <textarea
                className="w-full min-h-[180px] rounded-2xl border border-[#272046] bg-[#020012] p-3 text-sm text-white"
                placeholder="Digite ou ajuste a mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <button
                onClick={sendMessage}
                className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white px-4 py-3 text-sm font-medium"
              >
                Enviar mensagem
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
