// app/(app)/posts/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/hooks/useWorkspace";
import { usePosts } from "@/hooks/usePosts";
import type { PostStatus } from "@/types/post";
import { FiPlus, FiZap } from "react-icons/fi";

const STATUS_TABS: { id: PostStatus | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "published", label: "Publicado" },
  { id: "scheduled", label: "Agendado" },
  { id: "draft", label: "Rascunho" },
];

export default function PostsPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const [statusFilter, setStatusFilter] =
    useState<PostStatus | "all">("all");

  const { posts, loading } = usePosts({
    workspaceId,
    status: statusFilter,
  });

  const handleCreateWithAI = () => {
    router.push("/posts/ai");
  };

  const handleCreateManual = () => {
    router.push("/posts/manual");
  };

  return (
    <section className="mt-4 flex flex-col gap-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Posts & Agenda
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 max-w-xl">
            Gerencie todos os posts criados, agendados e já publicados.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={handleCreateWithAI}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold text-white shadow-lg"
            style={{
              background:
                "linear-gradient(90deg, #7C3AED 0%, #C026D3 50%, #0EA5E9 100%)",
            }}
          >
            <FiZap size={14} />
            Criar post com IA
          </button>
          <button
            onClick={handleCreateManual}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold border border-[#312356] text-[#E5E7EB] hover:bg-white/5 transition"
          >
            <FiPlus size={14} />
            Novo post manual
          </button>
        </div>
      </header>

      {/* Tabs de status */}
      <div className="flex gap-2 text-[11px]">
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full border transition ${
                active
                  ? "border-[#7C3AED] bg-[#7C3AED]/20 text-white"
                  : "border-[#272046] text-[#E5E7EB]/80 hover:bg-[#111827]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {loading && (
          <div className="text-center py-8 text-xs text-[#9CA3AF]">
            Carregando posts...
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-8 text-xs text-[#9CA3AF]">
            Nenhum post encontrado para esse filtro.
          </div>
        )}

        {!loading &&
          posts.map((post) => (
            <div
              key={post.id}
              className="rounded-2xl border border-[#272046] bg-[#050016] px-4 py-3 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[12px] text-white font-medium">
                    {post.title || post.text.substring(0, 50) || "Post sem título"}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {post.networks.join(" • ")} •{" "}
                    {post.status === "draft"
                      ? "Rascunho"
                      : post.status === "scheduled"
                      ? `Agendado para ${post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString() : 'data indefinida'}`
                      : "Publicado"}
                  </span>
                </div>

                {/* Badge de status */}
                <span
                  className={`text-[10px] px-3 py-1 rounded-full ${
                    post.status === "published"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : post.status === "scheduled"
                      ? "bg-sky-500/15 text-sky-400"
                      : "bg-zinc-500/15 text-zinc-300"
                  }`}
                >
                  {post.status === "published"
                    ? "Publicado"
                    : post.status === "scheduled"
                    ? "Agendado"
                    : "Rascunho"}
                </span>
              </div>

              <p className="text-[11px] text-[#D1D5DB] line-clamp-3">
                {post.text}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
