
"use client";

import { useState } from "react";

type DemoLog = {
  id: string;
  title: string;
  message: string;
  status: "success" | "info" | "error";
  createdAt: string;
};

export default function DemoPage() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [logs, setLogs] = useState<DemoLog[]>([
    {
      id: "initial",
      title: "Modo demonstração pronto",
      message:
        "Use os botões abaixo para simular eventos do VIRALINK durante a apresentação.",
      status: "info",
      createdAt: new Date().toLocaleTimeString("pt-BR"),
    },
  ]);

  function addLog(
    title: string,
    message: string,
    status: "success" | "info" | "error",
  ) {
    setLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        title,
        message,
        status,
        createdAt: new Date().toLocaleTimeString("pt-BR"),
      },
      ...prev,
    ]);
  }

  async function simulateFollower() {
    setLoadingAction("follower");
    try {
      const res = await fetch("/api/debug/test-new-follower", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: "workspace_123",
          socialAccountId: "fake_instagram_1",
          username: "julia_fit",
          name: "Júlia",
          externalId: `demo-${Date.now()}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addLog(
          "Falha ao simular novo seguidor",
          data?.error || "Não foi possível executar a simulação.",
          "error",
        );
        return;
      }

      addLog(
        "Novo seguidor simulado",
        "Automação de boas-vindas executada com sucesso. Verifique também os logs e o Firestore.",
        "success",
      );
    } catch (error) {
      addLog(
        "Erro na simulação",
        "Ocorreu um erro inesperado ao simular novo seguidor.",
        "error",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  function simulateComment() {
    addLog(
      "Comentário simulado",
      "Um comentário fictício foi recebido: “Qual o valor desse plano?”",
      "success",
    );

    setTimeout(() => {
      addLog(
        "Resposta automática preparada",
        "A automação identificou palavra-chave de orçamento e preparou uma resposta comercial.",
        "info",
      );
    }, 700);
  }

  function simulateMessage() {
    addLog(
      "Mensagem simulada",
      "Uma nova mensagem direta foi recebida no Instagram.",
      "success",
    );

    setTimeout(() => {
      addLog(
        "Fluxo de atendimento iniciado",
        "O VIRALINK classificou o lead e iniciou o atendimento automático.",
        "info",
      );
    }, 700);
  }

  function simulateEngagement() {
    addLog(
      "Engajamento simulado",
      "O post demonstrativo recebeu novas curtidas, comentários e compartilhamentos.",
      "success",
    );
  }

  function simulateGrowth() {
    addLog(
      "Crescimento simulado",
      "Os indicadores do painel foram atualizados para refletir crescimento de audiência e cliques.",
      "success",
    );
  }

  const cards = [
    {
      id: "follower",
      title: "Simular Novo Seguidor",
      description:
        "Dispara o fluxo de automação de boas-vindas no Instagram.",
      action: simulateFollower,
    },
    {
      id: "comment",
      title: "Simular Comentário",
      description:
        "Mostra uma interação pública e a reação automática do sistema.",
      action: simulateComment,
    },
    {
      id: "message",
      title: "Simular Mensagem",
      description:
        "Demonstra entrada de lead por direct e início de atendimento.",
      action: simulateMessage,
    },
    {
      id: "engagement",
      title: "Simular Engajamento",
      description:
        "Atualiza a percepção de atividade e movimentação nas redes.",
      action: simulateEngagement,
    },
    {
      id: "growth",
      title: "Simular Crescimento",
      description:
        "Ajuda a contar a história de evolução do perfil durante a demo.",
      action: simulateGrowth,
    },
  ];

  return (
    <section className="mt-4 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-white">Modo Demo</h1>
          <p className="text-sm text-[#9CA3AF]">
            Painel de simulação para apresentar o VIRALINK de forma visual,
            simples e rápida para o cliente.
          </p>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const isLoading = loadingAction === card.id;

          return (
            <div
              key={card.id}
              className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-3"
            >
              <div>
                <h2 className="text-sm font-medium text-white">{card.title}</h2>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {card.description}
                </p>
              </div>

              <button
                type="button"
                onClick={card.action}
                disabled={isLoading}
                className="mt-auto rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white text-sm font-medium py-2 hover:opacity-90 disabled:opacity-60 transition"
              >
                {isLoading ? "Executando..." : card.title}
              </button>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">
            Timeline da demonstração
          </h2>
          <button
            type="button"
            onClick={() => setLogs([])}
            className="text-xs text-[#9CA3AF] hover:text-white transition"
          >
            Limpar
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {logs.length === 0 && (
            <p className="text-xs text-[#9CA3AF]">
              Nenhum evento exibido ainda.
            </p>
          )}

          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-[#272046] bg-[#020012] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{log.title}</p>
                <span
                  className={`text-[10px] px-2 py-1 rounded-full ${
                    log.status === "success"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : log.status === "error"
                      ? "bg-rose-500/15 text-rose-400"
                      : "bg-sky-500/15 text-sky-400"
                  }`}
                >
                  {log.status === "success"
                    ? "Sucesso"
                    : log.status === "error"
                    ? "Erro"
                    : "Informação"}
                </span>
              </div>

              <p className="mt-1 text-xs text-[#C7CAD1]">{log.message}</p>
              <p className="mt-2 text-[10px] text-[#7D8590]">
                {log.createdAt}
              </p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
