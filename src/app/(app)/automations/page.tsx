// src/app/(app)/automations/page.tsx
"use client";

import { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useAutomations } from "@/hooks/useAutomations";
import type {
  AutomationChannel,
  AutomationTriggerType,
} from "@/types/automation";
import { createAutomation } from "@/firebase/automations";
import { useFirebase } from "@/firebase/provider";

const TRIGGERS: { id: AutomationTriggerType; label: string }[] = [
  { id: "new_follower", label: "Novo seguidor" },
  { id: "new_comment", label: "Novo comentário" },
  { id: "new_message", label: "Nova mensagem" },
  { id: "new_reaction", label: "Nova reação (curtida, etc.)" },
];

const CHANNELS: { id: AutomationChannel; label: string }[] = [
  { id: "instagram_dm", label: "Instagram Direct" },
  { id: "facebook_dm", label: "Facebook Messenger" },
  { id: "whatsapp", label: "WhatsApp" },
];

export default function AutomationsPage() {
  const { currentWorkspace } = useWorkspace();
  const { firestore } = useFirebase();
  const workspaceId = currentWorkspace?.id;

  const { accounts: socialAccounts } = useSocialAccounts(workspaceId);
  const { automations, loading } = useAutomations(workspaceId);

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // estado do novo formulário
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] =
    useState<AutomationTriggerType>("new_follower");
  const [network, setNetwork] = useState<"instagram" | "facebook" | "whatsapp">(
    "instagram",
  );
  const [socialAccountId, setSocialAccountId] = useState<string>("");
  const [actionChannel, setActionChannel] =
    useState<AutomationChannel>("instagram_dm");
  const [containsKeyword, setContainsKeyword] = useState("");
  const [messageTemplateId, setMessageTemplateId] =
    useState<string>("default_welcome");

  const handleOpenForm = () => {
    if (!workspaceId) {
      alert("Workspace não disponível.");
      return;
    }
    setShowForm(true);
  };

  const handleCreate = async () => {
    if (!workspaceId) {
      alert("Workspace não disponível.");
      return;
    }
    if (!name.trim()) {
      alert("Dê um nome para a automação.");
      return;
    }
    if (!socialAccountId) {
      alert("Selecione uma conta conectada.");
      return;
    }

    setCreating(true);
    try {
      await createAutomation(firestore, {
        workspaceId,
        name: name.trim(),
        active: true,
        triggerType,
        network,
        socialAccountId,
        actionChannel,
        messageTemplateId,
        conditions: containsKeyword
          ? { containsKeyword }
          : undefined,
      });

      // limpa form
      setName("");
      setContainsKeyword("");
      setMessageTemplateId("default_welcome");
      setShowForm(false);
    } catch (err) {
      console.error("[AutomacoesPage] erro ao criar automação:", err);
      alert("Erro ao criar automação.");
    } finally {
      setCreating(false);
    }
  };

  const getNetworkLabel = (net: string) => {
    if (net === "instagram") return "Instagram";
    if (net === "facebook") return "Facebook";
    if (net === "whatsapp") return "WhatsApp";
    return net;
  };

  const getTriggerLabel = (t: AutomationTriggerType) =>
    TRIGGERS.find((tr) => tr.id === t)?.label || t;

  const getChannelLabel = (c: AutomationChannel) =>
    CHANNELS.find((ch) => ch.id === c)?.label || c;

  const getAccountLabel = (id: string) => {
    const acc = socialAccounts.find((a) => a.id === id);
    if (!acc) return "Conta não encontrada";
    return acc.displayName || `${acc.network} (${acc.id})`;
  };

  return (
    <section className="mt-4 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">
            Automações
          </h1>
          <p className="text-xs text-[#9CA3AF]">
            Crie fluxos automáticos para responder seguidores, leads e clientes nas redes conectadas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenForm}
          className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]
                     text-[12px] font-medium text-white px-4 py-2 hover:opacity-90 transition"
        >
          Nova automação
        </button>
      </header>

      {/* Lista de automações */}
      <div className="flex flex-col gap-2">
        {loading && (
          <p className="text-xs text-[#9CA3AF]">Carregando automações...</p>
        )}

        {!loading && automations.length === 0 && (
          <p className="text-xs text-[#9CA3AF]">
            Nenhuma automação criada ainda. Clique em{" "}
            <span className="font-semibold">“Nova automação”</span> para começar.
          </p>
        )}

        {!loading &&
          automations.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-[#272046] bg-[#050016] px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="flex flex-col">
                <span className="text-[12px] text-white font-medium">
                  {a.name}
                </span>
                <span className="text-[10px] text-[#9CA3AF]">
                  Disparo: {getTriggerLabel(a.triggerType)} • Rede:{" "}
                  {getNetworkLabel(a.network)} • Conta:{" "}
                  {getAccountLabel(a.socialAccountId)}
                </span>
                <span className="text-[10px] text-[#9CA3AF]">
                  Ação: {getChannelLabel(a.actionChannel)} • Template:{" "}
                  {a.messageTemplateId}
                </span>
                {a.conditions?.containsKeyword && (
                  <span className="text-[10px] text-[#9CA3AF]">
                    Condição: comentário/mensagem contendo{" "}
                    <span className="font-medium">
                      “{a.conditions.containsKeyword}”
                    </span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] px-3 py-1 rounded-full ${
                    a.active
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-zinc-500/15 text-zinc-300"
                  }`}
                >
                  {a.active ? "Ativa" : "Pausada"}
                </span>

                <button className="text-[11px] text-[#E5E7EB] hover:text-white">
                  Editar
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Form de criação simples */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="w-full max-w-lg rounded-2xl border border-[#272046] bg-[#020012] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-white">
                Nova automação
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-[11px] text-[#9CA3AF] hover:text-white"
              >
                Fechar
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-[#E5E7EB] mb-1">
                Nome da automação
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#272046] bg-[#050016]
                           text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                placeholder="Ex.: Boas-vindas no Instagram"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Disparo
                </label>
                <select
                  value={triggerType}
                  onChange={(e) =>
                    setTriggerType(e.target.value as AutomationTriggerType)
                  }
                  className="w-full rounded-xl border border-[#272046] bg-[#050016]
                             text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                >
                  {TRIGGERS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Rede
                </label>
                <select
                  value={network}
                  onChange={(e) =>
                    setNetwork(
                      e.target.value as "instagram" | "facebook" | "whatsapp",
                    )
                  }
                  className="w-full rounded-xl border border-[#272046] bg-[#050016]
                             text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#E5E7EB] mb-1">
                Conta conectada
              </label>
              <select
                value={socialAccountId}
                onChange={(e) => setSocialAccountId(e.target.value)}
                className="w-full rounded-xl border border-[#272046] bg-[#050016]
                           text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
              >
                <option value="">Selecione uma conta</option>
                {socialAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {getNetworkLabel(acc.network)} – {acc.displayName}
                  </option>
                ))}
              </select>
              {socialAccounts.length === 0 && (
                <p className="mt-1 text-[10px] text-rose-400">
                  Nenhuma conta conectada. Vá em “Contas conectadas” para
                  vincular suas redes antes de criar automações.
                </p>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Canal de envio
                </label>
                <select
                  value={actionChannel}
                  onChange={(e) =>
                    setActionChannel(e.target.value as AutomationChannel)
                  }
                  className="w-full rounded-xl border border-[#272046] bg-[#050016]
                             text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                >
                  {CHANNELS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Condição (palavra-chave opcional)
                </label>
                <input
                  value={containsKeyword}
                  onChange={(e) => setContainsKeyword(e.target.value)}
                  className="w-full rounded-xl border border-[#272046] bg-[#050016]
                             text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  placeholder='Ex.: "preço", "valor", "promoção"...'
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#E5E7EB] mb-1">
                Template de mensagem (ID)
              </label>
              <input
                value={messageTemplateId}
                onChange={(e) => setMessageTemplateId(e.target.value)}
                className="w-full rounded-xl border border-[#272046] bg-[#050016]
                           text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                placeholder="Ex.: welcome_default, promo_lead_whatsapp..."
              />
              <p className="mt-1 text-[10px] text-[#9CA3AF]">
                Depois podemos criar uma tela própria de templates para não
                precisar digitar o ID manualmente.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded-xl border border-[#272046]
                           text-[12px] text-[#E5E7EB]/80 hover:bg-[#111827]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={handleCreate}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]
                           text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {creating ? "Criando..." : "Criar automação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
