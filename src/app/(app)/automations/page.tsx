// src/app/(app)/automations/page.tsx
"use client";

export default function AutomationsPage() {
  // futuro: hook useAutomations(workspaceId)
  const automations = [
    {
      id: "1",
      name: "Boas-vindas no Instagram",
      active: true,
      trigger: "Novo seguidor",
      channel: "Instagram DM",
    },
    {
      id: "2",
      name: "Responder orçamento no WhatsApp",
      active: false,
      trigger: "Mensagem com palavra 'preço'",
      channel: "WhatsApp",
    },
  ];

  return (
    <section className="mt-4 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">
            Automações
          </h1>
          <p className="text-xs text-[#9CA3AF]">
            Crie fluxos automáticos para responder seguidores, leads e clientes.
          </p>
        </div>

        <button
          type="button"
          className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]
                     text-[12px] font-medium text-white px-4 py-2 hover:opacity-90 transition"
        >
          Nova automação
        </button>
      </header>

      <div className="flex flex-col gap-2">
        {automations.map((a) => (
          <div
            key={a.id}
            className="rounded-2xl border border-[#272046] bg-[#050016] px-4 py-3 flex items-center justify-between gap-4"
          >
            <div className="flex flex-col">
              <span className="text-[12px] text-white font-medium">
                {a.name}
              </span>
              <span className="text-[10px] text-[#9CA3AF]">
                Disparo: {a.trigger} • Canal: {a.channel}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* status */}
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
    </section>
  );
}
