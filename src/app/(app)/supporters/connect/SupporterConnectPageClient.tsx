// src/app/(app)/supporters/connect/SupporterConnectPageClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/firebase/provider";
import { useWorkspace } from "@/hooks/useWorkspace";

type InviteNetwork = "instagram" | "facebook";

type InviteData = {
  id: string;
  workspaceId: string;
  primaryAccountId: string;
  supporterName: string | null;
  primaryAccountName: string;
  primaryUsername: string;
  network?: InviteNetwork;
};

export default function SupporterConnectPageClient() {
  const params = useSearchParams();
  const { user } = useUser();
  const { currentWorkspace } = useWorkspace();

  const token = params.get("token");

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvite() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/network/supporter-invites/validate?token=${token}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (!data.ok) {
          throw new Error(data.error || "Convite inválido.");
        }

        setInvite(data.invite);
      } catch (error: any) {
        alert(error?.message || "Erro ao validar convite.");
      } finally {
        setLoading(false);
      }
    }

    loadInvite();
  }, [token]);

  const inviteNetwork: InviteNetwork = useMemo(() => {
    return invite?.network === "facebook" ? "facebook" : "instagram";
  }, [invite]);

  function handleConnectSupporter() {
    if (!invite?.workspaceId || !user?.uid || !token) {
      alert("Convite, workspace ou usuário não identificado.");
      return;
    }

    const base =
      `/api/auth/facebook/start?workspaceId=${encodeURIComponent(
        invite.workspaceId
      )}&ownerUserId=${encodeURIComponent(
        user.uid
      )}&mode=supporter&token=${encodeURIComponent(token)}`;

    if (inviteNetwork === "facebook") {
      window.location.href =
        `${base}&network=facebook&accountType=page&allowProfile=false&allowPages=true`;
      return;
    }

    window.location.href =
      `${base}&network=instagram`;
  }

  if (loading) {
    return (
      <section className="min-h-screen bg-[#050016] text-white p-6">
        <p className="text-sm text-[#9CA3AF]">Validando convite...</p>
      </section>
    );
  }

  if (!invite) {
    return (
      <section className="min-h-screen bg-[#050016] text-white p-6">
        <p className="text-sm text-rose-400">Convite inválido ou expirado.</p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#050016] text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-[#272046] bg-[#0A0322] p-6 flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white">
            Entrar como apoiador
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Você foi convidado para se vincular à conta principal:
          </p>
        </div>

        <div className="rounded-xl border border-[#272046] bg-[#050016] p-3">
          <p className="text-sm font-medium text-white">
            {invite.primaryAccountName}
          </p>
          <p className="text-xs text-[#9CA3AF]">{invite.primaryUsername}</p>
          <p className="mt-2 text-[11px] text-[#A78BFA]">
            Rede do convite: {inviteNetwork === "facebook" ? "Facebook" : "Instagram"}
          </p>
        </div>

        {!user?.uid ? (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3">
            <p className="text-xs text-yellow-300">
              Faça login no sistema para conectar sua conta como apoiador.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConnectSupporter}
            className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-sm font-medium text-white px-4 py-2"
          >
            {inviteNetwork === "facebook"
              ? "Conectar meu Facebook como apoiador"
              : "Conectar meu Instagram como apoiador"}
          </button>
        )}

        {currentWorkspace?.id && invite.workspaceId !== currentWorkspace.id && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3">
            <p className="text-xs text-yellow-300">
              Atenção: você está logado em outro workspace. O convite será vinculado ao
              workspace correto após a autenticação.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}