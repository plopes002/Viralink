// src/app/(app)/revisao/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import { useWorkspace } from "@/hooks/useWorkspace";
import { scheduleMessageTime } from "@/lib/scheduleMessages";

export default function RevisaoPage() {
  const { currentWorkspace } = useWorkspace() as any;
  const { firestore } = useFirebase();
  const workspaceId = currentWorkspace?.id;
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!workspaceId || !firestore) return;

    const q = query(
      collection(firestore, "messages"),
      where("workspaceId", "==", workspaceId),
      where("status", "==", "awaiting_review"),
    );

    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [workspaceId, firestore]);

  async function approveMessage(item: any, index: number) {
    if (!firestore) return;
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
  }

  async function rejectMessage(item: any) {
    if (!firestore) return;
    await updateDoc(doc(firestore, "messages", item.id), {
      status: "skipped",
      updatedAt: new Date().toISOString(),
      errorMessage: "Envio rejeitado em revisão manual.",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Revisão de envios</h1>
        <p className="text-sm text-[#9CA3AF]">
          Aprove ou rejeite mensagens consideradas sensíveis ou de maior risco.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {items.length === 0 && (
          <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
            <p className="text-sm text-[#9CA3AF]">Nenhuma mensagem aguardando revisão.</p>
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

            <div className="mt-3 rounded-xl bg-[#020012] p-3">
              <p className="text-sm text-white whitespace-pre-line">{item.content}</p>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => approveMessage(item, index)}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400"
              >
                Aprovar
              </button>

              <button
                type="button"
                onClick={() => rejectMessage(item)}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-400"
              >
                Rejeitar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
