// src/app/(app)/revisao/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import { useWorkspace } from "@/hooks/useWorkspace";
import { scheduleMessageTime } from "@/lib/scheduleMessages";

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function RevisaoPage() {
  const { firestore } = useFirebase();
  const { currentWorkspace } = useWorkspace() as any;
  const workspaceId = currentWorkspace?.id;
  const [items, setItems] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId || !firestore) return;

    const q = query(
      collection(firestore, "messages"),
      where("workspaceId", "==", workspaceId),
      where("status", "==", "awaiting_review"),
    );

    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    
    return () => unsub();
  }, [workspaceId, firestore]);

  const groupedByChannel = useMemo(() => {
    return {
      instagram_dm: items.filter((i) => i.channel === "instagram_dm").length,
      facebook_dm: items.filter((i) => i.channel === "facebook_dm").length,
      whatsapp: items.filter((i) => i.channel === "whatsapp").length,
    };
  }, [items]);

  async function approveMessage(item: any, index: number) {
    if (!firestore) return;
    setProcessingId(item.id);
    try {
      const scheduledAt = scheduleMessageTime({
        channel: item.channel,
        index,
        fromDate: new Date(),
      });

      await updateDoc(doc(firestore, "messages", item.id), {
        status: "scheduled",
        scheduledAt,
        updatedAt: new Date().toISOString(),
        errorMessage: null,
      });
    } finally {
      setProcessingId(null);
    }
  }

  async function rejectMessage(item: any) {
    if (!firestore) return;
    setProcessingId(item.id);
    try {
      await updateDoc(doc(firestore, "messages", item.id), {
        status: "skipped",
        updatedAt: new Date().toISOString(),
        errorMessage: "Envio rejeitado em revisão manual.",
      });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Revisão de envios</h1>
        <p className="text-sm text-[#9CA3AF]">
          Aprove ou rejeite mensagens consideradas mais sensíveis antes do disparo.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Total em revisão</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {items.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Instagram DM</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {groupedByChannel.instagram_dm}
          </p>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Facebook DM</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {groupedByChannel.facebook_dm}
          </p>
        </div>

        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">WhatsApp</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {groupedByChannel.whatsapp}
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        {items.length === 0 && (
          <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
            <p className="text-sm text-[#9CA3AF]">
              Nenhuma mensagem aguardando revisão.
            </p>
          </div>
        )}

        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-2xl border border-[#272046] bg-[#050016] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">
                  {item.toUser || item.toPhone || "Destino não identificado"}
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  Canal: {item.channel}
                </p>
              </div>

              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[10px] text-amber-400">
                awaiting_review
              </span>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl bg-[#020012] p-3">
                <p className="text-[10px] text-[#9CA3AF] mb-2">
                  Texto da mensagem
                </p>
                <p className="text-sm text-white whitespace-pre-line">
                  {item.content}
                </p>
              </div>

              <div className="rounded-xl bg-[#020012] p-3">
                <p className="text-[10px] text-[#9CA3AF] mb-2">
                  Informações do envio
                </p>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-[#E5E7EB]">
                    Criada em: {formatDateTime(item.createdAt)}
                  </p>
                  <p className="text-xs text-[#E5E7EB]">
                    Campanha: {item.campaignId || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => approveMessage(item, index)}
                disabled={processingId === item.id}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 disabled:opacity-60"
              >
                {processingId === item.id ? "Aprovando..." : "Aprovar"}
              </button>

              <button
                type="button"
                onClick={() => rejectMessage(item)}
                disabled={processingId === item.id}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-400 disabled:opacity-60"
              >
                {processingId === item.id ? "Rejeitando..." : "Rejeitar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
