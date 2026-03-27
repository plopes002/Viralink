// src/app/(app)/social-accounts/page.tsx
"use client";

import { useWorkspace } from "@/hooks/useWorkspace";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import type { SocialNetwork } from "@/types/socialAccount";

type NetworkCardInfo = {
  network: SocialNetwork;
  label: string;
  description: string;
  connectLabel: string;
};

const NETWORKS: NetworkCardInfo[] = [
  {
    network: "instagram",
    label: "Instagram",
    description:
      "Conecte um perfil para monitorar engajamento, mensagens e seguidores.",
    connectLabel: "Conectar Instagram",
  },
  {
    network: "facebook",
    label: "Facebook",
    description:
      "Conecte sua página para acompanhar interações, comentários e mensagens.",
    connectLabel: "Conectar página do Facebook",
  },
  {
    network: "whatsapp",
    label: "WhatsApp",
    description:
      "Integre seu número ao fluxo de automações e notificações do VIRALINK.",
    connectLabel: "Configurar WhatsApp",
  },
];

export default function SocialAccountsPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const { accounts, loading } = useSocialAccounts(workspaceId);

  const getStatusForNetwork = (network: SocialNetwork) => {
    const acc = accounts.find((a) => a.network === network);

    if (!acc) {
      return {
        status: "disconnected" as const,
        label: "Não conectado",
        badgeClass: "bg-rose-500/15 text-rose-400",
        accountName: null,
      };
    }

    if (acc.status === "expired") {
      return {
        status: "expired" as const,
        label: "Conexão expirada",
        badgeClass: "bg-yellow-500/15 text-yellow-400",
        accountName: acc.name,
      };
    }

    if (acc.status === "connected") {
      return {
        status: "connected" as const,
        label: "Conectado",
        badgeClass: "bg-emerald-500/15 text-emerald-400",
        accountName: acc.name,
      };
    }

    // fallback
    return {
      status: "disconnected" as const,
      label: "Não conectado",
      badgeClass: "bg-rose-500/15 text-rose-400",
      accountName: acc.name,
    };
  };

  const handleOtherConnectClick = (network: SocialNetwork) => {
    alert(
      `Fluxo de conexão para ${network.toUpperCase()} ainda não implementado.`
    );
  };

  const handleManageClick = (network: SocialNetwork) => {
    alert(
      `Tela de gerenciamento da conta ${network.toUpperCase()} (trocar conta, desconectar, renovar token).`,
    );
  };

  return (
    <section className="mt-4 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">
            Contas conectadas
          </h1>
          <p className="text-xs text-[#9CA3AF]">
            Conecte seus perfis de Instagram, Facebook e WhatsApp para
            desbloquear automações, analytics e respostas inteligentes.
          </p>
        </div>
      </header>

      {loading && (
        <p className="text-xs text-[#9CA3AF]">
          Carregando contas vinculadas...
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {NETWORKS.map((n) => {
          const status = getStatusForNetwork(n.network);

          const hasAccount = !!status.accountName;

          const primaryLabel =
            status.status === "connected"
              ? "Gerenciar conexão"
              : status.status === "expired"
              ? "Renovar conexão"
              : n.connectLabel;
          
          const isInstagram = n.network === 'instagram';
          const isConnected = status.status === 'connected';

          return (
            <div
              key={n.network}
              className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">
                    {n.label}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {n.description}
                  </p>

                  {hasAccount && (
                    <p className="mt-2 text-[11px] text-[#E5E7EB]">
                      Conta:{" "}
                      <span className="font-medium">
                        {status.accountName}
                      </span>
                    </p>
                  )}
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[10px] ${status.badgeClass}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="mt-auto flex flex-col gap-2">
                {isInstagram ? (
                   <a
                    href={isConnected ? '#' : (workspaceId ? `/api/auth/instagram/start?workspaceId=${workspaceId}` : '#')}
                    onClick={(e) => {
                        if (isConnected) {
                            e.preventDefault();
                            handleManageClick('instagram');
                        } else if (!workspaceId) {
                            e.preventDefault();
                            alert("Workspace não disponível.");
                        }
                    }}
                    className="w-full text-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-[12px] font-medium text-white py-2 hover:opacity-90 transition"
                  >
                    {primaryLabel}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOtherConnectClick(n.network)}
                    className="w-full rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-[12px] font-medium text-white py-2 hover:opacity-90 transition"
                  >
                    {primaryLabel}
                  </button>
                )}

                {isConnected && (
                  <button
                    type="button"
                    onClick={() => handleManageClick(n.network)}
                    className="w-full rounded-xl border border-[#272046] text-[11px] text-[#E5E7EB]/80 py-1.5 hover:bg-[#111827] transition"
                  >
                    Ver detalhes da integração
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
