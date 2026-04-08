// src/app/(app)/whatsapp/page.tsx
"use client";

import Link from "next/link";

export default function WhatsAppPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#070014] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Central do WhatsApp</h1>
            <p className="mt-2 text-sm text-white/70">
              Gerencie conexão, testes de envio, histórico e futuros fluxos do WhatsApp.
            </p>
          </div>

          <span className="rounded-full bg-red-500/15 px-3 py-1 text-sm font-medium text-red-300">
            Não conectado
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#070014] p-6">
          <h2 className="text-lg font-semibold text-white">Conexão</h2>
          <p className="mt-2 text-sm text-white/70">
            Configure o número e prepare a integração oficial com o WhatsApp Business.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Número conectado</p>
              <p className="mt-1 text-white">Nenhum número configurado</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Ambiente</p>
              <p className="mt-1 text-white">Modo de preparação</p>
            </div>

            <button className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-3 font-semibold text-white">
              Configurar WhatsApp
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#070014] p-6">
          <h2 className="text-lg font-semibold text-white">Envio de teste</h2>
          <p className="mt-2 text-sm text-white/70">
            Use esta área para validar o fluxo visual antes da integração final.
          </p>

          <div className="mt-6 space-y-4">
            <input
              className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-white outline-none placeholder:text-white/35"
              placeholder="Telefone com DDI"
            />

            <textarea
              className="min-h-[140px] w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-white outline-none placeholder:text-white/35"
              placeholder="Digite uma mensagem de teste..."
            />

            <button className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-3 font-semibold text-white">
              Enviar teste
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#070014] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Histórico</h2>
            <p className="mt-2 text-sm text-white/70">
              Aqui aparecerão envios, respostas e eventos do WhatsApp.
            </p>
          </div>

          <Link
            href="/engajamento"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5"
          >
            Voltar para Engajamento
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/50">
          Nenhum evento encontrado ainda.
        </div>
      </section>
    </div>
  );
}
