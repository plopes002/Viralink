// app/(app)/posts/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiZap } from "react-icons/fi";
import { useScheduledPosts, type ScheduledPost } from "@/hooks/useScheduledPosts";
import { useDraftPosts, type DraftPost } from "@/hooks/useDraftPosts";
import { PostAgendaCard } from "./PostAgendaCard";
import { DraftPostCard } from "./DraftPostCard";
import { EditScheduledPostModal } from "./EditScheduledPostModal";
import { EditDraftPostModal } from "./EditDraftPostModal";
import { useFirebase } from "@/firebase/provider";
import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUser } from "@/firebase/provider";

type TabFilter = "todos" | "publicado" | "agendado" | "rascunho" | "erro";

export default function PostsAgendaPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { user: currentUser } = useUser();
  const workspaceId = currentWorkspace?.id ?? null;
  const ownerId = currentUser?.uid ?? null;

  const { firestore: db } = useFirebase();

  const [activeTab, setActiveTab] = useState<TabFilter>("todos");
  const [networkFilter, setNetworkFilter] = useState<string>("all");

  const { posts, loading: loadingScheduled } = useScheduledPosts({
    workspaceId,
  });
  const { drafts, loading: loadingDrafts } = useDraftPosts({ workspaceId });

  const [editingPost, setEditingPost] =
    useState<ScheduledPost & { boardStatus: string } | null>(null);
  const [editingDraft, setEditingDraft] =
    useState<DraftPost | null>(null);

  const handleCreateWithAI = () => {
    router.push("/posts/ai");
  };

  const handleCreateManual = () => {
    router.push("/posts/manual");
  };

  const filteredScheduled = useMemo(() => {
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

  const filteredDrafts = useMemo(() => {
    if (activeTab !== "rascunho" && activeTab !== "todos") {
      return [];
    }
    return drafts.filter((draft) => {
      if (networkFilter !== "all") {
        return draft.networks.includes(networkFilter);
      }
      return true;
    });
  }, [drafts, activeTab, networkFilter]);

  const loading = loadingScheduled || loadingDrafts;

  const handleDuplicate = async (post: ScheduledPost) => {
    if (!db || !workspaceId || !ownerId) return;
    try {
      const ref = collection(db, "scheduledPosts");
      await addDoc(ref, {
        workspaceId,
        ownerId,
        networks: post.networks,
        content: post.content,
        timeZone: post.timeZone,
        runAt: new Date(Date.now() + 60 * 60 * 1000), // Agenda para 1h a partir de agora
        status: "pending",
        lastError: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("[PostsAgenda] erro ao duplicar post:", err);
    }
  };

  const handleCancel = async (post: ScheduledPost) => {
    if (!db) return;
    try {
      // Em vez de mudar status, vamos mover para rascunhos para manter o fluxo simples
      const draftRef = collection(db, "draftPosts");
      await addDoc(draftRef, {
        workspaceId: post.workspaceId,
        ownerId: post.ownerId,
        networks: post.networks,
        content: post.content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Exclui o agendamento
      await deleteDoc(doc(db, "scheduledPosts", post.id));
    } catch (err) {
      console.error("[PostsAgenda] erro ao cancelar agendamento:", err);
    }
  };

  const handleQuickScheduleDraft = async (draft: DraftPost) => {
    if (!db || !workspaceId || !ownerId) return;
    try {
      const ref = collection(db, "scheduledPosts");
      await addDoc(ref, {
        workspaceId,
        ownerId,
        networks: draft.networks,
        content: draft.content,
        timeZone: currentWorkspace?.timeZone ?? "America/Sao_Paulo",
        runAt: new Date(Date.now() + 60 * 60 * 1000),
        status: "pending",
        lastError: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await deleteDoc(doc(db, "draftPosts", draft.id));
    } catch (err) {
      console.error("[PostsAgenda] erro ao agendar rascunho:", err);
    }
  };

  const handleDeleteDraft = async (draft: DraftPost) => {
    if (!db) return;
    if (!confirm("Tem certeza que deseja excluir este rascunho?")) return;
    try {
      await deleteDoc(doc(db, "draftPosts", draft.id));
    } catch (err) {
      console.error("[PostsAgenda] erro ao excluir rascunho:", err);
    }
  };

  return (
    <section className="mt-4 flex flex-col gap-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Posts &amp; Agenda
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
        {([
          { id: "todos", label: "Todos" },
          { id: "publicado", label: "Publicado" },
          { id: "agendado", label: "Agendado" },
          { id: "rascunho", label: "Rascunho & Erros" },
        ] as { id: TabFilter; label: string }[]).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
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

      <div className="mt-2 space-y-2">
        {loading && (
          <div className="text-xs text-[#9CA3AF] text-center py-6">
            Carregando posts, agendamentos e rascunhos...
          </div>
        )}

        {!loading &&
          filteredScheduled.length === 0 &&
          filteredDrafts.length === 0 && (
            <div className="text-xs text-[#9CA3AF] text-center py-6">
              Nenhum item encontrado para esse filtro. Que tal criar um
              novo post?
            </div>
          )}

        {!loading &&
          filteredScheduled.map((post) => (
            <PostAgendaCard
              key={post.id}
              post={post}
              onEdit={setEditingPost}
              onDuplicate={handleDuplicate}
              onCancel={handleCancel}
            />
          ))}

        {!loading &&
          filteredDrafts.map((draft) => (
            <DraftPostCard
              key={draft.id}
              draft={draft}
              onEdit={setEditingDraft}
              onQuickSchedule={handleQuickScheduleDraft}
              onDelete={handleDeleteDraft}
            />
          ))}
      </div>
      
      <EditScheduledPostModal
        post={editingPost}
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
      />

      <EditDraftPostModal
        draft={editingDraft}
        isOpen={!!editingDraft}
        onClose={() => setEditingDraft(null)}
      />
    </section>
  );
}
