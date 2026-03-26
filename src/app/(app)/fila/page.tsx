// src/app/(app)/fila/page.tsx
"use client";

import { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProcessingQueue } from "@/hooks/useProcessingQueue";

export default function QueuePage() {
  const { currentWorkspace } = useWorkspace() as any;
  const workspaceId = currentWorkspace?.id;
  const { jobs, loading } = useProcessingQueue(workspaceId);
  const [processing, setProcessing] = useState(false);

  const pending = jobs.filter((j) => j.status === "pending").length;
  const done = jobs.filter((j) => j.status === "done").length;
  const errors = jobs.filter((j) => j.status === "error").length;

  async function processQueue() {
    setProcessing(true);
    try {
      const res = await fetch("/api/queue/process", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Erro ao processar fila.");
        return;
      }
      alert(`Processamento concluído: ${data.processed} jobs.`);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Fila de processamento</h1>
          <p className="text-sm text-[#9CA3AF]">
            Acompanhe os trabalhos automáticos do VIRALINK.
          </p>
        </div>

        <button
          type="button"
          onClick={processQueue}
          disabled={processing}
          className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {processing ? "Processando..." : "Processar fila manualmente"}
        </button>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Pendentes</p>
          <p className="mt-1 text-2xl font-semibold text-white">{pending}</p>
        </div>
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Concluídos</p>
          <p className="mt-1 text-2xl font-semibold text-white">{done}</p>
        </div>
        <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
          <p className="text-[11px] text-[#9CA3AF]">Erros</p>
          <p className="mt-1 text-2xl font-semibold text-white">{errors}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
        <h2 className="text-sm font-semibold text-white mb-4">Itens da fila</h2>

        <div className="flex flex-col gap-3">
          {loading && (
            <p className="text-sm text-[#9CA3AF]">Carregando fila...</p>
          )}

          {!loading && jobs.length === 0 && (
            <p className="text-sm text-[#9CA3AF]">Nenhum job encontrado.</p>
          )}

          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-xl border border-[#272046] bg-[#020012] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{job.type}</p>
                  <p className="text-xs text-[#9CA3AF]">
                    Job: {job.id.substring(0, 10)}...
                  </p>
                </div>

                <span
                  className={`text-[10px] px-3 py-1 rounded-full ${
                    job.status === "done"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : job.status === "error"
                      ? "bg-rose-500/15 text-rose-400"
                      : job.status === "processing"
                      ? "bg-sky-500/15 text-sky-400"
                      : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {job.status}
                </span>
              </div>

              <div className="mt-2 text-xs text-[#C7CAD1]">
                <p>Tentativas: {job.attempts}</p>
                {job.errorMessage && (
                  <p className="mt-1 text-rose-400">
                    Erro: {job.errorMessage}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
