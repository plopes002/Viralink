// app/(app)/notificacoes/page.tsx
"use client";

import { useState, useMemo } from "react";
import { FiCheckCircle, FiAlertCircle, FiBarChart2, FiTrendingUp } from "react-icons/fi";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification, NotificationType } from "@/types/notification";
import { useUser } from "@/firebase/provider";

function useCurrentUserAndWorkspace() {
  const { user } = useUser();
  // TODO: Replace with dynamic workspace ID from context
  const workspaceId = user ? "agency_123" : null;
  return {
    uid: user?.uid ?? null,
    workspaceId: workspaceId,
  };
}

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min atrás`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h atrás`;

  const diffD = Math.floor(diffH / 24);
  return `${diffD} d atrás`;
}

function NotificationIcon({ n }: { n: Notification }) {
  const base =
    "h-8 w-8 flex items-center justify-center rounded-full border text-xs";

  switch (n.type) {
    case "post_published":
      return (
        <div className={`${base} bg-emerald-500/10 border-emerald-500/50 text-emerald-300`}>
          <FiCheckCircle size={14} />
        </div>
      );
    case "post_publish_failed":
      return (
        <div className={`${base} bg-red-500/10 border-red-500/50 text-red-300`}>
          <FiAlertCircle size={14} />
        </div>
      );
    case "metrics_updated":
      return (
        <div className={`${base} bg-sky-500/10 border-sky-500/50 text-sky-300`}>
          <FiBarChart2 size={14} />
        </div>
      );
    case "competitor_alert":
    default:
      return (
        <div className={`${base} bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-300`}>
          <FiTrendingUp size={14} />
        </div>
      );
  }
}

type FilterType = "all" | NotificationType;
type FilterStatus = "all" | "unread" | "read";

export default function NotificationsPage() {
  const { uid, workspaceId } = useCurrentUserAndWorkspace();

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications(workspaceId, uid);

  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filterType !== "all" && n.type !== filterType) return false;

      const isUnread = uid ? !n.readBy?.includes(uid) : false;

      if (filterStatus === "unread" && !isUnread) return false;
      if (filterStatus === "read" && isUnread) return false;

      return true;
    });
  }, [notifications, filterType, filterStatus, uid]);

  return (
    <section className="mt-4 space-y-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Notificações
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 max-w-xl">
            Acompanhe em tempo real o que está acontecendo com seus posts, automações e métricas.
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-1">
          <p className="text-[11px] text-[#9CA3AF]">
            {loading
              ? "Carregando..."
              : unreadCount > 0
              ? `${unreadCount} notificação(ões) não lida(s)`
              : "Nenhuma notificação pendente."}
          </p>
          <button
            type="button"
            disabled={!uid || unreadCount === 0}
            onClick={markAllAsRead}
            className="px-3 py-1.5 rounded-full border border-[#312356] text-[11px] text-[#E5E7EB] hover:bg-white/5 disabled:opacity-40"
          >
            Marcar todas como lidas
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="text-[#9CA3AF] mr-1">Tipo:</span>
          {([
            { key: "all", label: "Todos" },
            { key: "post_published", label: "Publicações OK" },
            { key: "post_publish_failed", label: "Falhas na publicação" },
            { key: "metrics_updated", label: "Métricas atualizadas" },
            { key: "competitor_alert", label: "Concorrentes" },
          ] as { key: FilterType; label: string }[]).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilterType(opt.key)}
              className={`px-3 py-1.5 rounded-full border transition ${
                filterType === opt.key
                  ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                  : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="text-[#9CA3AF] mr-1">Status:</span>
          {([
            { key: "all", label: "Todas" },
            { key: "unread", label: "Não lidas" },
            { key: "read", label: "Lidas" },
          ] as { key: FilterStatus; label: string }[]).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilterStatus(opt.key)}
              className={`px-3 py-1.5 rounded-full border transition ${
                filterStatus === opt.key
                  ? "border-[#7C3AED] text-white bg-[#7C3AED]/20"
                  : "border-[#312356] text-[#CBD5E1] hover:bg-white/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="mt-2 rounded-2xl border border-[#261341] bg-[#050017] divide-y divide-[#1F1134]">
        {filteredNotifications.length === 0 && !loading && (
          <div className="px-4 py-6 text-center text-[11px] text-[#9CA3AF]">
            Nenhuma notificação encontrada com os filtros atuais.
          </div>
        )}

        {filteredNotifications.map((n) => {
          const isUnread = uid ? !n.readBy?.includes(uid) : false;

          return (
            <button
              key={n.id}
              type="button"
              onClick={async () => {
                if (isUnread && uid) {
                  await markAsRead(n.id);
                }
                // FUTURO: se tiver página de detalhes do post:
                // router.push(`/posts/${n.postId}`)
              }}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#0B001F] transition ${
                isUnread ? "bg-[#050017]" : "bg-transparent"
              }`}
            >
              <NotificationIcon n={n} />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[12px] ${
                    isUnread ? "text-[#F9FAFB]" : "text-[#E5E7EB]"
                  }`}
                >
                  {n.message}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-[#6B7280]">
                  <span>{timeAgo(n.createdAt)}</span>
                  {n.channels && n.channels.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{n.channels.join(", ")}</span>
                    </>
                  )}
                </div>
              </div>
              {isUnread && (
                <span className="mt-1 h-2 w-2 rounded-full bg-pink-500" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
