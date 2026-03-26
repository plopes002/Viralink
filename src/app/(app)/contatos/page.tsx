// src/app/(app)/contatos/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useContacts } from "@/hooks/useContacts";
import { updateContact } from "@/firebase/contacts";
import type { ContactItem, ContactStatus } from "@/types/contact";
import { useFirebase } from "@/firebase/provider";

type TemperatureFilter = "all" | "cold" | "warm" | "hot" | "priority";

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

const CONTACT_STATUSES: { id: ContactStatus; label: string }[] = [
  { id: "novo", label: "Novo" },
  { id: "em_contato", label: "Em contato" },
  { id: "respondeu", label: "Respondeu" },
  { id: "qualificado", label: "Qualificado" },
  { id: "aguardando", label: "Aguardando" },
  { id: "convertido", label: "Convertido" },
  { id: "sem_interesse", label: "Sem interesse" },
];

export default function ContatosPage() {
  const { currentWorkspace } = useWorkspace() as any;
  const { firestore } = useFirebase();
  const workspaceId = currentWorkspace?.id;

  const { contacts, loading } = useContacts(workspaceId);

  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null);
  const [search, setSearch] = useState("");
  const [temperatureFilter, setTemperatureFilter] =
    useState<TemperatureFilter>("all");
  const [statusFilter, setStatusFilter] =
    useState<ContactStatus | "all">("all");

  const filtered = useMemo(() => {
    return contacts.filter((contact) => {
      const haystack = [
        contact.name,
        contact.username,
        contact.phone,
        contact.email,
        ...(contact.categories || []),
        ...(contact.operationalTags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (search.trim() && !haystack.includes(search.trim().toLowerCase())) {
        return false;
      }

      if (
        temperatureFilter !== "all" &&
        contact.leadTemperature !== temperatureFilter
      ) {
        return false;
      }

      if (statusFilter !== "all" && contact.contactStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [contacts, search, temperatureFilter, statusFilter]);

  function openWhatsApp(contact: ContactItem) {
    if (!contact.phone) return;

    const digits = contact.phone.replace(/\D/g, "");
    const text = encodeURIComponent(
      `Olá ${contact.name.split(" ")[0]}! Tudo bem? Estou entrando em contato para continuarmos nossa conversa 😊`,
    );

    window.open(`https://wa.me/${digits}?text=${text}`, "_blank");
  }

  async function saveNotesAndStatus() {
    if (!selectedContact || !firestore) return;

    await updateContact(firestore, selectedContact.id, {
      notes: selectedContact.notes || null,
      contactStatus: selectedContact.contactStatus,
      updatedAt: new Date().toISOString(),
    });

    alert("Contato atualizado com sucesso.");
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Contatos</h1>
        <p className="text-sm text-[#9CA3AF]">
          CRM básico para organizar a base, acompanhar status e atuar por WhatsApp ou campanha.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <label className="block text-[11px] text-[#E5E7EB] mb-1">
            Busca
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome, usuário, telefone, e-mail..."
            className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
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
            className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
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
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ContactStatus | "all")
            }
            className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
          >
            <option value="all">Todos</option>
            {CONTACT_STATUSES.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">
              Lista de contatos
            </h2>
            <span className="text-xs text-[#9CA3AF]">
              {loading ? "Carregando..." : `${filtered.length} contato(s)`}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {!loading && filtered.length === 0 && (
              <p className="text-sm text-[#9CA3AF]">
                Nenhum contato encontrado.
              </p>
            )}

            {filtered.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => setSelectedContact(contact)}
                className={`text-left rounded-2xl border p-4 transition ${
                  selectedContact?.id === contact.id
                    ? "border-[#8B5CF6] bg-[#111827]"
                    : "border-[#272046] bg-[#020012] hover:bg-[#0B1120]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {contact.name}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      {contact.username || "Sem username"}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full ${getTemperatureClass(
                        contact.leadTemperature,
                      )}`}
                    >
                      {getTemperatureLabel(contact.leadTemperature)}
                    </span>

                    <span className="text-[10px] px-2 py-1 rounded-full bg-sky-500/15 text-sky-400">
                      {CONTACT_STATUSES.find((s) => s.id === contact.contactStatus)?.label}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] text-[#7D8590]">Telefone</p>
                    <p className="text-xs text-white">
                      {contact.phone || "Não informado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-[#7D8590]">E-mail</p>
                    <p className="text-xs text-white">
                      {contact.email || "Não informado"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <h2 className="text-sm font-semibold text-white mb-4">
            Detalhes do contato
          </h2>

          {!selectedContact ? (
            <p className="text-sm text-[#9CA3AF]">
              Selecione um contato para ver e editar detalhes.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                <p className="text-lg font-semibold text-white">
                  {selectedContact.name}
                </p>
                <p className="text-sm text-[#9CA3AF]">
                  {selectedContact.username || "Sem username"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`text-[10px] px-3 py-1 rounded-full ${getTemperatureClass(
                      selectedContact.leadTemperature,
                    )}`}
                  >
                    {getTemperatureLabel(selectedContact.leadTemperature)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                <div className="grid gap-3">
                  <div>
                    <p className="text-[11px] text-[#7D8590]">Telefone</p>
                    <p className="text-sm text-white">
                      {selectedContact.phone || "Não informado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-[#7D8590]">E-mail</p>
                    <p className="text-sm text-white">
                      {selectedContact.email || "Não informado"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#7D8590] mb-1">
                      Status do contato
                    </label>
                    <select
                      value={selectedContact.contactStatus}
                      onChange={(e) =>
                        setSelectedContact({
                          ...selectedContact,
                          contactStatus: e.target.value as ContactStatus,
                        })
                      }
                      className="w-full rounded-xl border border-[#272046] bg-[#020012] px-3 py-2 text-sm text-white"
                    >
                      {CONTACT_STATUSES.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#7D8590] mb-1">
                      Observações
                    </label>
                    <textarea
                      value={selectedContact.notes || ""}
                      onChange={(e) =>
                        setSelectedContact({
                          ...selectedContact,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Anotações sobre este contato..."
                      className="min-h-[140px] w-full rounded-2xl border border-[#272046] bg-[#020012] p-3 text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              {(selectedContact.operationalTags || []).length > 0 && (
                <div className="rounded-2xl border border-[#272046] bg-[#020012] p-4">
                  <p className="text-[11px] text-[#7D8590] mb-2">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedContact.operationalTags?.map((tag) => (
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

              <div className="flex flex-col gap-2">
                {selectedContact.phone && (
                  <button
                    type="button"
                    onClick={() => openWhatsApp(selectedContact)}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400"
                  >
                    Abrir no WhatsApp
                  </button>
                )}

                <button
                  type="button"
                  onClick={saveNotesAndStatus}
                  className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-3 text-sm font-medium text-white"
                >
                  Salvar contato
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
