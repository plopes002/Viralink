// app/(app)/posts/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiZap } from "react-icons/fi";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useUser } from "@/firebase/provider";
import { PostAgendaCard } from "./PostAgendaCard";
import { EditScheduledPostModal } from "./EditScheduledPostModal";
import { useFirebase } from "@/firebase/provider";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useWorkspace } from "@/hooks/useWorkspace";

type TabFilter = "todos" | "publicado" | "agendado" | "rascunho";

export default function PostsAgendaPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace(); 
  const workspaceId = currentWorkspace?.id ?? null;

  const { firestore: db } = useFirebase();
  const [activeTab, setActiveTab] = useState<TabFilter>("todos");
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const { posts, loading } = useScheduledPosts({ workspaceId });

  const [editingPost, setEditingPost] =
    useState<(typeof posts)[number] | null>(null);

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      if (
        activeTab !== "todos" &&
        post.boardStatus !== activeTab &&
        !(activeTab === "rascunho" && post.boardStatus === "erro")
      ) {
        return false;
      }

      if (networkFilter !== "all") {
        return post.networks.includes(networkFilter);
      }

      return true;
    });
  }, [posts, activeTab, networkFilter]);

  const handleCreateWithAI = () => {
    router.push("/posts/ai");
  };

  const handleCreateManual = () => {
    router.push("/posts/manual");
  };

  const handleDuplicate = async (post: (typeof posts)[number]) => {
    if (!db || !workspaceId) return;

    try {
      const ref = collection(db, "scheduledPosts");
      await addDoc(ref, {
        workspaceId,
        ownerId: post.ownerId,
        networks: post.networks,
        content: post.content,
        timeZone: post.timeZone,
        // por padrão, duplica para HOJE + 1 hora
        runAt: new Date(Date.now() + 60 * 60 * 1000),
        status: "pending",
        lastError: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("[PostsAgenda] erro ao duplicar post:", err);
    }
  };

  const handleCancel = async (post: (typeof posts)[number]) => {
    if (!db) return;
    try {
      const ref = doc(db, "scheduledPosts", post.id);
      await updateDoc(ref, {
        status: "cancelled", // You may need to add 'cancelled' to your ScheduledStatus type
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("[PostsAgenda] erro ao cancelar agendamento:", err);
    }
  };

  return (
    <section className="mt-4 space-y-6">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Posts & Agenda
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 max-w-xl">
            Gerencie seus posts, veja o que está agendado e crie novos conteúdos
            com IA em poucos cliques.
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
      {/* Filtros principais */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: "todos", label: "Todos" },
            { id: "publicado", label: "Publicado" },
            { id: "agendado", label: "Agendado" },
            { id: "rascunho", label: "Rascunho / com erro" },
          ].map((tab) => {
            const isActive = activeTab === (tab.id as TabFilter);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabFilter)}
                className={`px-3 py-1.5 rounded-full border text-[11px] transition ${
                  isActive
                    ? "border-[#7C3AED] bg-[#7C3AED]/20 text-white"
                    : "border-[#261341] text-[#E5E7EB]/80 hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filtro por rede */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#9CA3AF]">Filtrar por rede:</span>
          <select
            value={networkFilter}
            onChange={(e) => setNetworkFilter(e.target.value)}
            className="bg-[#050017] border border-[#261341] rounded-full px-3 py-1 text-[11px] text-[#E5E7EB] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          >
            <option value="all">Todas</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="mt-2 space-y-2">
        {loading && (
          <div className="text-center py-8 text-xs text-[#9CA3AF]">
            Carregando posts agendados...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-8 text-xs text-[#9CA3AF]">
            Nenhum post encontrado para esse filtro. Que tal criar um novo
            agendamento?
          </div>
        )}

        {!loading &&
          filtered.map((post) => (
            <PostAgendaCard
              key={post.id}
              post={post}
              onEdit={setEditingPost}
              onDuplicate={handleDuplicate}
              onCancel={handleCancel}
            />
          ))}
      </div>

      <EditScheduledPostModal
        post={editingPost}
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
      />
    </section>
  );
}
