// src/app/(app)/demo/page.tsx
"use client";

import { useMemo, useState } from "react";

type DemoLog = {
  id: string;
  title: string;
  message: string;
  status: "success" | "info" | "error";
  createdAt: string;
};

type LeadPreview = {
  name: string;
  username: string;
  avatar: string;
};

type LastAutomationPreview = {
  eventLabel: string;
  automationName: string;
  templateName: string;
  sentMessage: string;
};

type DemoMetrics = {
  followers: number;
  comments: number;
  messages: number;
  engagement: number;
};

const INITIAL_METRICS: DemoMetrics = {
  followers: 18240,
  comments: 314,
  messages: 129,
  engagement: 6.4,
};

const LEAD_POOL: LeadPreview[] = [
  {
    name: "Júlia Martins",
    username: "@julia_fit",
    avatar: "JM",
  },
  {
    name: "Carlos Souza",
    username: "@carlos_business",
    avatar: "CS",
  },
  {
    name: "Mariana Lima",
    username: "@mah.lima",
    avatar: "ML",
  },
  {
    name: "Fernanda Rocha",
    username: "@fernandarocha",
    avatar: "FR",
  },
];

export default function DemoPage() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<DemoMetrics>(INITIAL_METRICS);

  const [lastLead, setLastLead] = useState<LeadPreview | null>(null);

  const [lastAutomation, setLastAutomation] =
    useState<LastAutomationPreview | null>(null);

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

  function pickRandomLead() {
    return LEAD_POOL[Math.floor(Math.random() * LEAD_POOL.length)];
  }

  const simulateFollower = async () => {
    setLoadingAction("follower");
    const lead = pickRandomLead();

    try {
      const sentMessage = `Oi ${lead.name.split(" ")[0]}! 👋 Obrigado por seguir o nosso perfil, ${lead.username}. Se precisar de algo, é só chamar por aqui 💜`;

      setTimeout(() => {
        setMetrics((prev) => ({
          ...prev,
          followers: prev.followers + 1,
          engagement: Number((prev.engagement + 0.1).toFixed(1)),
        }));

        setLastLead(lead);

        setLastAutomation({
          eventLabel: "Novo seguidor no Instagram",
          automationName: "Boas-vindas novos seguidores IG",
          templateName: "Boas-vindas novo seguidor IG",
          sentMessage,
        });

        addLog(
          "Novo seguidor simulado",
          `${lead.name} começou a seguir o perfil e a automação de boas-vindas foi executada.`,
          "success",
        );

        setTimeout(() => {
          addLog(
            "Mensagem automática enviada",
            `A mensagem de boas-vindas foi enviada para ${lead.username}.`,
            "info",
          );
        }, 700);

        setLoadingAction(null);
      }, 500);
    } catch (error) {
      addLog(
        "Erro na simulação",
        "Ocorreu um erro inesperado ao simular novo seguidor.",
        "error",
      );
      setLoadingAction(null);
    }
  };

  function simulateComment() {
    setLoadingAction("comment");
    const lead = pickRandomLead();

    setTimeout(() => {
      setMetrics((prev) => ({
        ...prev,
        comments: prev.comments + 3,
        engagement: Number((prev.engagement + 0.2).toFixed(1)),
      }));

      setLastLead(lead);

      setLastAutomation({
        eventLabel: "Novo comentário detectado",
        automationName: "Responder orçamento Instagram",
        templateName: "Resposta orçamento Direct",
        sentMessage:
          `Oi ${lead.name.split(" ")[0]}! 💬 Obrigado pelo seu comentário. Vou te chamar no direct para te passar todos os detalhes.`,
      });

      addLog(
        "Comentário simulado",
        `${lead.username} comentou: “Qual o valor desse plano?”`,
        "success",
      );

      setTimeout(() => {
        addLog(
          "Resposta automática preparada",
          "A automação identificou uma palavra-chave comercial e preparou uma resposta para conversão.",
          "info",
        );
      }, 700);

      setLoadingAction(null);
    }, 500);
  }

  function simulateMessage() {
    setLoadingAction("message");
    const lead = pickRandomLead();

    setTimeout(() => {
      setMetrics((prev) => ({
        ...prev,
        messages: prev.messages + 1,
        engagement: Number((prev.engagement + 0.1).toFixed(1)),
      }));

      setLastLead(lead);

      setLastAutomation({
        eventLabel: "Nova mensagem recebida",
        automationName: "Primeiro atendimento automático",
        templateName: "Template atendimento inicial",
        sentMessage:
          `Olá ${lead.name.split(" ")[0]}! 👋 Recebi sua mensagem. Vou te ajudar com prazer. Me conta rapidinho o que você precisa?`,
      });

      addLog(
        "Mensagem simulada",
        `${lead.username} enviou uma mensagem direta para o perfil.`,
        "success",
      );

      setTimeout(() => {
        addLog(
          "Fluxo de atendimento iniciado",
          "O VIRALINK classificou o lead e iniciou o atendimento automático via Direct.",
          "info",
        );
      }, 700);

      setLoadingAction(null);
    }, 500);
  }

  function simulateEngagement() {
    setLoadingAction("engagement");

    setTimeout(() => {
      setMetrics((prev) => ({
        ...prev,
        comments: prev.comments + 8,
        messages: prev.messages + 2,
        engagement: Number((prev.engagement + 0.4).toFixed(1)),
      }));

      addLog(
        "Engajamento simulado",
        "O post demonstrativo recebeu novas curtidas, comentários e compartilhamentos, elevando o índice de engajamento.",
        "success",
      );

      setLoadingAction(null);
    }, 500);
  }

  function simulateGrowth() {
    setLoadingAction("growth");

    setTimeout(() => {
      setMetrics((prev) => ({
        followers: prev.followers + 27,
        comments: prev.comments + 5,
        messages: prev.messages + 3,
        engagement: Number((prev.engagement + 0.6).toFixed(1)),
      }));

      addLog(
        "Crescimento simulado",
        "Os indicadores foram atualizados para refletir crescimento de audiência, tráfego e interesse do público.",
        "success",
      );

      setLoadingAction(null);
    }, 500);
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
        "Mostra evolução do perfil para contar a história do resultado.",
      action: simulateGrowth,
    },
  ];

  const kpis = useMemo(
    () => [
      {
        label: "Seguidores",
        value: metrics.followers.toLocaleString("pt-BR"),
        helper: "Audiência atual",
      },
      {
        label: "Comentários",
        value: metrics.comments.toLocaleString("pt-BR"),
        helper: "Interações públicas",
      },
      {
        label: "Mensagens",
        value: metrics.messages.toLocaleString("pt-BR"),
        helper: "Leads em atendimento",
      },
      {
        label: "Engajamento",
        value: `${metrics.engagement.toFixed(1)}%`,
        helper: "Índice consolidado",
      },
    ],
    [metrics],
  );

  return (
    <section className="mt-4 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-white">Modo Demo</h1>
          <p className="text-sm text-[#9CA3AF]">
            Painel de simulação para apresentar o VIRALINK de forma visual,
            dinâmica e convincente para o cliente.
          </p>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#272046] bg-[#050016] p-4"
          >
            <p className="text-[11px] text-[#9CA3AF]">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {item.value}
            </p>
            <p className="mt-1 text-[10px] text-[#7D8590]">{item.helper}</p>
          </div>
        ))}
      </section>

      {/* Botões */}
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

      {/* Painel vivo */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Último lead */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <h2 className="text-sm font-semibold text-white mb-3">
            Último lead detectado
          </h2>

          {!lastLead ? (
            <p className="text-xs text-[#9CA3AF]">
              Nenhum lead exibido ainda. Use uma simulação para gerar atividade.
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-white font-semibold">
                {lastLead.avatar}
              </div>
              <div>
                <p className="text-sm text-white font-medium">{lastLead.name}</p>
                <p className="text-xs text-[#9CA3AF]">{lastLead.username}</p>
              </div>
            </div>
          )}
        </div>

        {/* Última automação */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <h2 className="text-sm font-semibold text-white mb-3">
            Última automação disparada
          </h2>

          {!lastAutomation ? (
            <p className="text-xs text-[#9CA3AF]">
              Nenhuma automação executada ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-[11px] text-[#9CA3AF]">Evento</p>
                <p className="text-sm text-white">{lastAutomation.eventLabel}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#9CA3AF]">Automação</p>
                <p className="text-sm text-white">
                  {lastAutomation.automationName}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#9CA3AF]">Template</p>
                <p className="text-sm text-white">
                  {lastAutomation.templateName}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Balão de mensagem */}
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <h2 className="text-sm font-semibold text-white mb-3">
            Última mensagem enviada
          </h2>

          {!lastAutomation ? (
            <p className="text-xs text-[#9CA3AF]">
              Nenhuma mensagem enviada ainda.
            </p>
          ) : (
            <div className="flex justify-end">
              <div className="max-w-[90%] rounded-2xl rounded-br-md bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-3">
                <p className="text-sm text-white leading-relaxed">
                  {lastAutomation.sentMessage}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Timeline */}
      <section className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">
            Timeline da demonstração
          </h2>
          <button
            type="button"
            onClick={() => {
              setLogs([]);
              setLastLead(null);
              setLastAutomation(null);
              setMetrics(INITIAL_METRICS);
            }}
            className="text-xs text-[#9CA3AF] hover:text-white transition"
          >
            Resetar demo
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
