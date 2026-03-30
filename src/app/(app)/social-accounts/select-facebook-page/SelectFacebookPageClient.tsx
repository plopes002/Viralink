// src/app/(app)/social-accounts/select-facebook-page/SelectFacebookPageClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PageItem = {
  id: string;
  name: string;
};

type SessionData = {
  id: string;
  mode: "primary" | "supporter";
  pages: PageItem[];
};

export default function SelectFacebookPageClient() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session");

  const [session, setSession] = useState<SessionData | null>(null);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/auth/facebook/page-selection/session?session=${encodeURIComponent(
            sessionId
          )}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (!data.ok) {
          throw new Error(data.error || "Não foi possível carregar as páginas.");
        }

        setSession(data.session);

        if (data.session?.pages?.length) {
          setSelectedPageId(data.session.pages[0].id);
        }
      } catch (error: any) {
        alert(error?.message || "Erro ao carregar seleção.");
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId]);

  const selectedPage = useMemo(
    () => session?.pages.find((p) => p.id === selectedPageId) || null,
    [session, selectedPageId]
  );

  async function handleConfirm() {
    if (!sessionId || !selectedPageId) {
      alert("Selecione uma página.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/auth/facebook/page-selection/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          pageId: selectedPageId,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao confirmar página.");
      }

      router.push(data.redirectTo);
    } catch (error: any) {
      alert(error?.message || "Erro ao confirmar página.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="min-h-screen bg-[#050016] text-white p-6">
        <p className="text-sm text-[#9CA3AF]">Carregando páginas...</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="min-h-screen bg-[#050016] text-white p-6">
        <p className="text-sm text-rose-400">Sessão de seleção inválida ou expirada.</p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#050016] text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl border border-[#272046] bg-[#0A0322] p-6 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">
            Escolha a página do Facebook
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Encontramos mais de uma página nesta conta. Selecione qual deseja conectar.
          </p>
        </div>

        <div className="grid gap-3">
          {session.pages.map((page) => {
            const active = page.id === selectedPageId;

            return (
              <button
                key={page.id}
                type="button"
                onClick={() => setSelectedPageId(page.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-[#06B6D4] bg-[#07152A]"
                    : "border-[#272046] bg-[#050016] hover:bg-[#0e0a1f]"
                }`}
              >
                <p className="text-sm font-medium text-white">{page.name}</p>
                <p className="text-[11px] text-[#9CA3AF] mt-1">{page.id}</p>
              </button>
            );
          })}
        </div>

        {selectedPage && (
          <div className="rounded-xl border border-[#272046] bg-[#050016] p-3">
            <p className="text-[11px] text-[#9CA3AF]">Página selecionada</p>
            <p className="text-sm font-medium text-white mt-1">
              {selectedPage.name}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedPageId || submitting}
            className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-sm font-medium text-white px-4 py-2 disabled:opacity-60"
          >
            {submitting ? "Conectando..." : "Confirmar e conectar"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/social-accounts")}
            className="rounded-xl border border-[#272046] text-sm text-white px-4 py-2"
          >
            Cancelar
          </button>
        </div>
      </div>
    </section>
  );
}