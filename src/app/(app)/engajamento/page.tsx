"use client";

import { useMemo, useState } from "react";
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


type SentimentFilter = "all" | EngagementSentiment;
type InteractionFilter = "all" | EngagementInteractionType;
type FollowFilter = "all" | "followers" | "non_followers";

export default function EngagementPage() {
  const [selectedUser, setSelectedUser] = useState<EngagementItem | null>(null);
  const [message, setMessage] = useState("");

  const { firestore } = useFirebase();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const { engagements, loading } = useEngagements(workspaceId);
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
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [smartSearch, setSmartSearch] = useState("");
  const [taggingOneId, setTaggingOneId] = useState<string | null>(null);
  const [taggingAll, setTaggingAll] = useState(false);

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

      if (!matchesSmartSearch(item, smartSearch)) {
        return false;
      }

      return true;
    });
  }, [engagements, sentimentFilter, interactionFilter, followFilter, topicFilter, categoryFilter, smartSearch]);

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

  async function sendMessage() {
    if (!selectedUser || !message.trim()) return;

    await fetch("/api/engagement/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: selectedUser.username,
        message,
      }),
    });

    alert(`Mensagem enviada para @${selectedUser.username}`);
    setMessage("");
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

  async function handleBulkSend() {
    if (!workspaceId || !bulkCategory || !bulkMessage.trim()) return;

    setBulkSending(true);
    try {
      const res = await fetch("/api/engagement/send-bulk-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          category: bulkCategory,
          message: bulkMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao disparar mensagens.");
        return;
      }

      alert(`Mensagens enfileiradas: ${data.queued}`);
      setBulkMessage("");
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
            Disparo por categoria
          </h2>

          <div className="flex flex-col gap-3">
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>

            <textarea
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
              placeholder="Digite a mensagem para essa categoria..."
              className="min-h-[120px] rounded-xl border border-[#272046] bg-[#020012] p-3 text-sm text-white"
            />

            <button
              type="button"
              onClick={handleBulkSend}
              disabled={bulkSending}
              className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {bulkSending ? "Enviando..." : "Enviar para categoria"}
            </button>
          </div>
        </div>
      </section>

      {/* filtros */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
            Sentimento
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

                  <span
                    className={`text-[10px] px-2 py-1 rounded-full ${getSentimentClass(
                      item.interactionSentiment,
                    )}`}
                  >
                    {getSentimentLabel(item.interactionSentiment)}
                  </span>
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
                  className="mt-3 rounded-lg border border-[#272046] px-3 py-1.5 text-[11px] text-[#E5E7EB] hover:bg-[#111827]"
                  disabled={taggingOneId === item.id}
                >
                  {taggingOneId === item.id ? "Analisando..." : "Sugerir categorias com IA"}
                </button>
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
                        onClick={() => {
                           if (!firestore) return;
                           alreadyHas
                            ? removeCategoryFromEngagement(firestore, selectedUser.id, cat.slug)
                            : addCategoryToEngagement(firestore, selectedUser.id, cat.slug)
                          }
                        }
                        className={`rounded-full px-3 py-1 text-xs ${
                          alreadyHas
                            ? "bg-rose-500/15 text-rose-400"
                            : "bg-[#111827] text-[#E5E7EB]"
                        }`}
                      >
                        {alreadyHas ? `Remover ${cat.name}` : `Adicionar ${cat.name}`}
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
