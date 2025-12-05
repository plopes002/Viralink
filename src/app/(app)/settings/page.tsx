// src/app/(app)/settings/page.tsx
"use client";

import { useState } from "react";

type TabId = "geral" | "notificacoes" | "seguranca";

const tabs: { id: TabId; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "notificacoes", label: "Notificações" },
  { id: "seguranca", label: "Segurança" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("geral");

  return (
    <section className="mt-4 flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-semibold text-white">
          Configurações
        </h1>
        <p className="text-xs text-[#9CA3AF]">
          Ajuste as preferências da sua conta e do seu workspace.
        </p>
      </header>

      {/* tabs */}
      <div className="flex gap-2 text-[11px]">
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-full border transition ${
                active
                  ? "border-[#7C3AED] bg-[#7C3AED]/20 text-white"
                  : "border-[#272046] text-[#E5E7EB]/80 hover:bg-[#111827]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* conteúdo por aba */}
      <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-4">
        {tab === "geral" && (
          <>
            <div>
              <label className="block text-[11px] text-[#E5E7EB] mb-1">
                Nome da agência / workspace
              </label>
              <input
                className="w-full rounded-xl border border-[#272046] bg-[#020012]
                           text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                placeholder="Ex.: Agência Digital Exemplo"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Fuso horário
                </label>
                <select
                  className="w-full rounded-xl border border-[#272046] bg-[#020012]
                             text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                >
                  <option value="America/Sao_Paulo">America/São_Paulo</option>
                  <option value="America/Manaus">America/Manaus</option>
                  <option value="America/Cuiaba">America/Cuiabá</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#E5E7EB] mb-1">
                  Idioma
                </label>
                <select
                  className="w-full rounded-xl border border-[#272046] bg-[#020012]
                             text-[12px] text-[#E5E7EB] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#7C3AED]"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">Inglês</option>
                </select>
              </div>
            </div>
          </>
        )}

        {tab === "notificacoes" && (
          <div className="flex flex-col gap-3 text-[12px] text-[#E5E7EB]">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="accent-[#7C3AED]" />
              Notificar por e-mail sobre novos leads e mensagens.
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="accent-[#7C3AED]" />
              Notificar por WhatsApp sobre falhas em automações.
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="accent-[#7C3AED]" />
              Mostrar notificações dentro da plataforma.
            </label>
          </div>
        )}

        {tab === "seguranca" && (
          <div className="flex flex-col gap-3 text-[12px] text-[#E5E7EB]">
            <p className="text-[11px] text-[#9CA3AF]">
              Aqui você poderá gerenciar dispositivos, sessões e, futuramente,
              ativar autenticação em duas etapas (2FA).
            </p>
            <button className="self-start rounded-xl border border-[#272046] text-[12px] text-[#E5E7EB] px-3 py-1.5 hover:bg-[#111827]">
              Encerrar outras sessões ativas
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
