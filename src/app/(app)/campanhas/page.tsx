// src/app/(app)/campanhas/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useEngagementProfiles } from "@/hooks/useEngagementProfiles";
import { useCampaigns } from "@/hooks/useCampaigns";
import type { Campaign, CampaignChannel } from "@/types/campaign";
import { useMessages } from "@/hooks/useMessages";
import { useQueuePolling } from "@/hooks/useQueuePolling";
import { CAMPAIGN_TEMPLATE_TYPES } from "@/constants/campaignTemplateTypes";
import type { CampaignTemplateType } from "@/types/campaignTemplate";
import { useSavedCampaignTemplates } from "@/hooks/useSavedCampaignTemplates";
import {
  createSavedCampaignTemplate,
  updateSavedCampaignTemplate,
  deleteSavedCampaignTemplate,
} from "@/firebase/savedCampaignTemplates";
import { useFirebase } from "@/firebase/provider";
import type { SavedCampaignTemplate } from "@/types/savedCampaignTemplate";
import { useCompetitorLeads } from "@/hooks/useCompetitorLeads";
import { useContacts } from "@/hooks/useContacts";

type TemperatureFilter = "all" | "cold" | "warm" | "hot" | "priority";
type FollowFilter = "all" | "followers" | "non_followers";

function getStatusClass(status?: string) {
  if (status === "done") return "bg-emerald-500/15 text-emerald-400";
  if (status === "processing") return "bg-sky-500/15 text-sky-400";
  if (status === "error") return "bg-rose-500/15 text-rose-400";
  return "bg-amber-500/15 text-amber-400";
}

function getRiskLabel(risk?: string) {
  if (risk === "high") return "Alto risco";
  if (risk === "medium") return "Risco médio";
  return "Baixo risco";
}

function getRiskClass(risk?: string) {
  if (risk === "high") return "bg-rose-500/15 text-rose-400";
  if (risk === "medium") return "bg-amber-500/15 text-amber-400";
  return "bg-emerald-500/15 text-emerald-400";
}

export default function CampanhasPage() {
  const { firestore } = useFirebase();
  const { currentWorkspace } = useWorkspace() as any;
  const workspaceId = currentWorkspace?.id;

  const { profiles, loading: loadingProfiles } = useEngagementProfiles(workspaceId);
  const { contacts, loading: loadingContacts } = useContacts(workspaceId);
  const { leads: competitorLeads, loading: loadingLeads } = useCompetitorLeads(workspaceId);
  const { campaigns } = useCampaigns(workspaceId);
  const { messages } = useMessages(workspaceId);
  const { templates, loading: loadingTemplates } =
    useSavedCampaignTemplates(workspaceId);
  
  useQueuePolling({
    enabled: !!workspaceId,
    intervalMs: 20000,
  });

  const [name, setName] = useState("");
  const [channel, setChannel] = useState<CampaignChannel>("instagram_dm");
  const [message, setMessage] = useState("");
  const [audienceMode, setAudienceMode] = useState<"profiles" | "contacts" | "competitor">("profiles");
  
  const [filters, setFilters] = useState({
    temperature: "all",
    followStatus: "all",
    category: "all",
    operationalTag: "all",
    search: "",
    // competitor filters
    onlyNonFollowers: false,
    onlyEngaged: false,
    sentiment: "all",
    interactionType: "all",
  });

  const [dispatching, setDispatching] = useState(false);

  // AI states
  const [templateType, setTemplateType] =
    useState<CampaignTemplateType>("aproximacao");
  const [topic, setTopic] = useState("");
  const [audienceDescription, setAudienceDescription] = useState("");
  const [tone, setTone] = useState("profissional");
  const [generatingTemplate, setGeneratingTemplate] = useState(false);

  const [templateNameToSave, setTemplateNameToSave] = useState("");
  const [templateDescriptionToSave, setTemplateDescriptionToSave] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  
  const loading = loadingProfiles || loadingContacts || loadingLeads;

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
    let sourceData: any[];
    if (audienceMode === 'contacts') {
      sourceData = contacts;
    } else if (audienceMode === 'competitor') {
      sourceData = competitorLeads;
    } else {
      sourceData = profiles;
    }
  
    return sourceData.filter((profile: any) => {
      if (audienceMode === 'competitor') {
        if (filters.onlyNonFollowers && profile.isFollower) return false;
        if (filters.onlyEngaged && !profile.hasInteracted) return false;
        if (filters.sentiment !== 'all' && profile.sentiment !== filters.sentiment) return false;
        if (filters.interactionType !== 'all' && profile.interactionType !== filters.interactionType) return false;
        return true;
      }
  
      // Default logic for profiles and contacts
      if (filters.temperature !== "all" && profile.leadTemperature !== filters.temperature) {
        return false;
      }
      if (filters.followStatus === "followers" && !profile.isFollower) {
        return false;
      }
      if (filters.followStatus === "non_followers" && profile.isFollower) {
        return false;
      }
      if (filters.category !== "all" && !(profile.categories || []).includes(filters.category)) {
        return false;
      }
      if (filters.operationalTag !== "all" && !(profile.operationalTags || []).includes(filters.operationalTag)) {
        return false;
      }
      if (filters.search.trim()) {
        const term = filters.search.trim().toLowerCase();
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
  }, [profiles, contacts, competitorLeads, filters, audienceMode]);

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
          filters,
          audienceMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao disparar campanha.");
        return;
      }

      alert(
        [
          `Campanha criada com sucesso.`,
          `Risco: ${data.riskLevel || "n/a"}`,
          `Agendadas: ${data.scheduledCount ?? 0}`,
          `Em revisão: ${data.reviewCount ?? 0}`,
          `Puladas: ${data.skippedCount ?? 0}`,
          data?.note || "",
        ]
          .filter(Boolean)
          .join("\n"),
      );

      setName("");
      setMessage("");
    } finally {
      setDispatching(false);
    }
  }

  async function handleGenerateTemplate() {
    setGeneratingTemplate(true);
    try {
      const res = await fetch("/api/campaigns/generate-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateType,
          channel,
          topic,
          audienceDescription,
          tone,
          context:
            `Filtros atuais: temperatura=${filters.temperature}, followStatus=${filters.followStatus}, ` +
            `categoria=${filters.category}, tag=${filters.operationalTag}, busca=${filters.search}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao gerar template.");
        return;
      }

      if (data?.title && !name.trim()) {
        setName(data.title);
      }

      if (data?.generatedMessage) {
        setMessage(data.generatedMessage);
      }
    } finally {
      setGeneratingTemplate(false);
    }
  }

  async function handleSaveCurrentTemplate() {
    if (!workspaceId || !firestore) return;
    if (!message.trim()) {
      alert("Gere ou escreva uma mensagem antes de salvar o template.");
      return;
    }
  
    setSavingTemplate(true);
    try {
      const now = new Date().toISOString();
  
      await createSavedCampaignTemplate(firestore, {
        workspaceId,
        name: templateNameToSave.trim() || name.trim() || "Template sem nome",
        description: templateDescriptionToSave.trim() || null,
        templateType,
        channel,
        tone,
        topic: topic || null,
        audienceDescription: audienceDescription || null,
        message,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      });
  
      setTemplateNameToSave("");
      setTemplateDescriptionToSave("");
      alert("Template salvo com sucesso.");
    } finally {
      setSavingTemplate(false);
    }
  }

  function applySavedTemplate(template: SavedCampaignTemplate) {
    setName(template.name || "");
    setChannel(template.channel || "instagram_dm");
    setTemplateType(template.templateType || "aproximacao");
    setTone(template.tone || "profissional");
    setTopic(template.topic || "");
    setAudienceDescription(template.audienceDescription || "");
    setMessage(template.message || "");
  }
  
  function duplicateCampaign(campaign: Campaign) {
    setName(`${campaign.name} (cópia)`);
    setChannel(campaign.channel || "instagram_dm");
    setMessage(campaign.message || "");
    setFilters(prev => ({
        ...prev,
        temperature: campaign.audienceFilters?.temperature || "all",
        followStatus: campaign.audienceFilters?.followStatus || "all",
        category: campaign.audienceFilters?.category || "all",
        operationalTag: campaign.audienceFilters?.operationalTag || "all",
        search: campaign.audienceFilters?.search || "",
    }));
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

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Em revisão</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {messages.filter((m) => m.status === "awaiting_review").length}
          </p>
        </div>
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Agendadas</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {messages.filter((m) => m.status === "scheduled").length}
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
          <p className="text-[11px] text-[#9CA3AF]">Puladas</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {messages.filter((m) => m.status === "skipped").length}
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

          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
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
          
          <div>
            <label className="block text-[11px] text-[#E5E7EB] mb-1">
              Público da campanha
            </label>
            <select
                value={audienceMode}
                onChange={(e) => setAudienceMode(e.target.value as any)}
                className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
            >
                <option value="profiles">Perfis (Engajamento)</option>
                <option value="contacts">Contatos (CRM)</option>
                <option value="competitor">Leads de Concorrentes 🔥</option>
            </select>
          </div>

          {audienceMode === "competitor" ? (
            <div className="grid gap-3 md:grid-cols-2 text-sm text-white p-3 rounded-xl border border-[#272046] bg-[#020012]">
                <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={filters.onlyNonFollowers}
                    onChange={(e) =>
                    setFilters({ ...filters, onlyNonFollowers: e.target.checked })
                    }
                />
                Apenas quem NÃO segue você
                </label>

                <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={filters.onlyEngaged}
                    onChange={(e) =>
                    setFilters({ ...filters, onlyEngaged: e.target.checked })
                    }
                />
                Apenas quem interagiu (não só visualizou)
                </label>

                <select
                    value={filters.sentiment}
                    onChange={(e) =>
                        setFilters({ ...filters, sentiment: e.target.value })
                    }
                    className="rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
                >
                    <option value="all">Todos os sentimentos</option>
                    <option value="positive">Positivo</option>
                    <option value="neutral">Neutro</option>
                    <option value="negative">Negativo</option>
                </select>
                <select
                    value={filters.interactionType}
                    onChange={(e) =>
                        setFilters({ ...filters, interactionType: e.target.value })
                    }
                    className="rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
                >
                    <option value="all">Todas as interações</option>
                    <option value="comment">Comentário</option>
                    <option value="like">Curtida</option>
                    <option value="view">Visualização</option>
                </select>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <select
                value={filters.temperature}
                onChange={(e) =>
                    setFilters({ ...filters, temperature: e.target.value })
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
                value={filters.followStatus}
                onChange={(e) =>
                    setFilters({ ...filters, followStatus: e.target.value })
                }
                className="rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
                >
                <option value="all">Todos</option>
                <option value="followers">Já seguem</option>
                <option value="non_followers">Não seguem</option>
                </select>

                <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
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
                value={filters.operationalTag}
                onChange={(e) =>
                    setFilters({ ...filters, operationalTag: e.target.value })
                }
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
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Busca livre..."
                className="xl:col-span-2 rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
                />
            </div>
          )}


          <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white">
              Gerar mensagem com IA
            </h3>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Tipo de campanha
                </label>
                <select
                  value={templateType}
                  onChange={(e) =>
                    setTemplateType(e.target.value as CampaignTemplateType)
                  }
                  className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
                >
                  {CAMPAIGN_TEMPLATE_TYPES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-[#9CA3AF]">
                  {
                    CAMPAIGN_TEMPLATE_TYPES.find((item) => item.id === templateType)
                      ?.description
                  }
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Tom de voz
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
                >
                  <option value="profissional">Profissional</option>
                  <option value="humano">Humano</option>
                  <option value="proximo">Próximo</option>
                  <option value="mobilizador">Mobilizador</option>
                  <option value="convincente">Convincente</option>
                  <option value="acolhedor">Acolhedor</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Tema
                </label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex.: educação, segurança, evento..."
                  className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Descrição do público
                </label>
                <input
                  value={audienceDescription}
                  onChange={(e) => setAudienceDescription(e.target.value)}
                  placeholder="Ex.: professores que interagiram"
                  className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerateTemplate}
                disabled={generatingTemplate}
                className="rounded-xl border border-[#272046] px-4 py-2 text-sm text-white hover:bg-[#111827] disabled:opacity-60"
              >
                {generatingTemplate ? "Gerando..." : "Gerar mensagem com IA"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white">
              Salvar na biblioteca
            </h3>
          
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={templateNameToSave}
                onChange={(e) => setTemplateNameToSave(e.target.value)}
                placeholder="Nome do template"
                className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
              />
          
              <input
                value={templateDescriptionToSave}
                onChange={(e) => setTemplateDescriptionToSave(e.target.value)}
                placeholder="Descrição curta"
                className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
              />
            </div>
          
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveCurrentTemplate}
                disabled={savingTemplate}
                className="rounded-xl border border-[#272046] px-4 py-2 text-sm text-white hover:bg-[#111827] disabled:opacity-60"
              >
                {savingTemplate ? "Salvando..." : "Salvar template"}
              </button>
            </div>
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
                    {profile.leadTemperature || profile.sentiment}
                  </span>
                </div>

                {(profile.operationalTags || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.operationalTags?.map((tag: any) => (
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

      <section className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">
            Biblioteca de templates
          </h2>
          <span className="text-xs text-[#9CA3AF]">
            {loadingTemplates ? "Carregando..." : `${templates.length} template(s)`}
          </span>
        </div>
      
        <div className="flex flex-col gap-3">
          {!loadingTemplates && templates.length === 0 && (
            <p className="text-sm text-[#9CA3AF]">
              Nenhum template salvo ainda.
            </p>
          )}
      
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-xl border border-[#272046] bg-[#020012] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">
                      {template.name}
                    </p>
                    {template.isFavorite && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] text-amber-400">
                        Favorito
                      </span>
                    )}
                  </div>
      
                  {template.description && (
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      {template.description}
                    </p>
                  )}
      
                  <p className="mt-2 text-[11px] text-[#7D8590]">
                    {template.templateType} • {template.channel} • {template.tone || "sem tom"}
                  </p>
                </div>
      
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => applySavedTemplate(template)}
                    className="rounded-lg border border-[#272046] px-3 py-1.5 text-[11px] text-white hover:bg-[#111827]"
                  >
                    Usar template
                  </button>
      
                  <button
                    type="button"
                    onClick={() =>
                      updateSavedCampaignTemplate(firestore, template.id, {
                        isFavorite: !template.isFavorite,
                        updatedAt: new Date().toISOString(),
                      })
                    }
                    className="rounded-lg border border-[#272046] px-3 py-1.5 text-[11px] text-white hover:bg-[#111827]"
                  >
                    {template.isFavorite ? "Desfavoritar" : "Favoritar"}
                  </button>
      
                  <button
                    type="button"
                    onClick={() => deleteSavedCampaignTemplate(firestore, template.id)}
                    className="rounded-lg border border-rose-500/20 px-3 py-1.5 text-[11px] text-rose-400 hover:bg-rose-500/10"
                  >
                    Excluir
                  </button>
                </div>
              </div>
      
              <div className="mt-3 rounded-xl bg-[#111827] px-3 py-3">
                <p className="text-xs text-[#E5E7EB] whitespace-pre-line">
                  {template.message}
                </p>
              </div>
            </div>
          ))}
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
            
              const awaitingReview = campaignMessages.filter(
                (m) => m.status === "awaiting_review",
              ).length;
              const scheduled = campaignMessages.filter(
                (m) => m.status === "scheduled",
              ).length;
              const processing = campaignMessages.filter(
                (m) => m.status === "processing",
              ).length;
              const sent = campaignMessages.filter(
                (m) => m.status === "sent",
              ).length;
              const skipped = campaignMessages.filter(
                (m) => m.status === "skipped",
              ).length;
              const error = campaignMessages.filter(
                (m) => m.status === "error",
              ).length;
            
              return (
                <div
                  key={campaign.id}
                  className="rounded-xl border border-[#272046] bg-[#020012] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        Canal: {campaign.channel} • Público: {campaign.recipientsCount}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`text-[10px] px-3 py-1 rounded-full ${getStatusClass(
                            campaign.status,
                          )}`}
                        >
                          {campaign.status}
                        </span>
                        <span
                          className={`text-[10px] px-3 py-1 rounded-full ${getRiskClass(
                            campaign.riskLevel,
                          )}`}
                        >
                          {getRiskLabel(campaign.riskLevel)}
                        </span>
                        {campaign.audienceMode && (
                          <span className="text-[10px] px-3 py-1 rounded-full bg-[#111827] text-[#E5E7EB]">
                            {campaign.audienceMode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
            
                  <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
                    <div className="rounded-lg bg-[#111827] px-2 py-2">
                      <p className="text-[10px] text-[#9CA3AF]">Revisão</p>
                      <p className="text-sm text-white">{awaitingReview}</p>
                    </div>
                    <div className="rounded-lg bg-[#111827] px-2 py-2">
                      <p className="text-[10px] text-[#9CA3AF]">Agendadas</p>
                      <p className="text-sm text-white">{scheduled}</p>
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
                      <p className="text-[10px] text-[#9CA3AF]">Puladas</p>
                      <p className="text-sm text-white">{skipped}</p>
                    </div>
                    <div className="rounded-lg bg-[#111827] px-2 py-2">
                      <p className="text-[10px] text-[#9CA3AF]">Erros</p>
                      <p className="text-sm text-white">{error}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => duplicateCampaign(campaign)}
                      className="rounded-lg border border-[#272046] px-3 py-1.5 text-[11px] text-white hover:bg-[#111827]"
                    >
                      Duplicar campanha
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}
