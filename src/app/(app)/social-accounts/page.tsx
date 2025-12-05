// src/app/(app)/social-accounts/page.tsx
"use client";

import { useState } from "react";

export default function SocialAccountsPage() {
  // futuramente: hook pra carregar socialAccounts do workspace
  const [loading] = useState(false);

  return (
    <section className="mt-4 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">
            Contas conectadas
          </h1>
          <p className="text-xs text-[#9CA3AF]">
            Gerencie as contas do Instagram, Facebook e WhatsApp conectadas ao VIRALINK.
          </p>
        </div>
      </header>

      {loading && (
        <p className="text-xs text-[#9CA3AF]">Carregando contas...</p>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {/* Card Instagram */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Instagram</p>
              <p className="text-[11px] text-[#9CA3AF]">
                Conecte um perfil ou conta profissional para monitorar e automatizar.
              </p>
            </div>
            {/* badge de status (dinâmico futuramente) */}
            <span className="px-3 py-1 rounded-full text-[10px] bg-rose-500/15 text-rose-400">
              Não conectado
            </span>
          </div>

          <button
            type="button"
            className="mt-auto w-full rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]
                       text-[12px] font-medium text-white py-2 hover:opacity-90 transition"
          >
            Conectar Instagram
          </button>
        </div>

        {/* Card Facebook */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Facebook</p>
              <p className="text-[11px] text-[#9CA3AF]">
                Conecte sua página para acompanhar interações e automatizar respostas.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400">
              Conectado
            </span>
          </div>

          <button
            type="button"
            className="mt-auto w-full rounded-xl border border-[#272046]
                       text-[12px] text-[#E5E7EB] py-2 hover:bg-[#111827] transition"
          >
            Gerenciar conexão
          </button>
        </div>

        {/* Card WhatsApp */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">WhatsApp</p>
              <p className="text-[11px] text-[#9CA3AF]">
                Integre seu número com o fluxo de automações e notificações.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] bg-yellow-500/15 text-yellow-400">
              Conexão pendente
            </span>
          </div>

          <button
            type="button"
            className="mt-auto w-full rounded-xl border border-[#272046]
                       text-[12px] text-[#E5E7EB] py-2 hover:bg-[#111827] transition"
          >
            Configurar WhatsApp
          </button>
        </div>
      </div>
    </section>
  );
}
