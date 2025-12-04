// app/(app)/components/NotificationsBell.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiBell,
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart2,
  FiTrendingUp, // 👈 para concorrentes
} from "react-icons/fi";
import { useNotifications } from "../../../hooks/useNotifications";
import type { Notification } from "../../../types/notification";

interface NotificationsBellProps {
  workspaceId: string | null;
  uid: string | null;
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

function getIconForNotification(n: Notification) {
  const baseClass = "h-7 w-7 flex items-center justify-center rounded-full";

  switch (n.type) {
    case "post_published":
      return (
        <div
          className={`${baseClass} bg-emerald-500/10 border border-emerald-500/40 text-emerald-300`}
        >
          <FiCheckCircle size={14} />
        </div>
      );
    case "post_publish_failed":
      return (
        <div
          className={`${baseClass} bg-red-500/10 border border-red-500/40 text-red-300`}
        >
          <FiAlertCircle size={14} />
        </div>
      );
    case "metrics_updated":
      return (
        <div
          className={`${baseClass} bg-sky-500/10 border border-sky-500/40 text-sky-300`}
        >
          <FiBarChart2 size={14} />
        </div>
      );
    case "competitor_alert":
    default:
      return (
        <div
          className={`${baseClass} bg-fuchsia-500/10 border border-fuchsia-500/40 text-fuchsia-300`}
        >
          <FiTrendingUp size={14} />
        </div>
      );
  }
}

export function NotificationsBell({
  workspaceId,
  uid,
}: NotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications(workspaceId, uid);

  const hasUnread = unreadCount > 0;

  return (
    <div className="relative">
      {/* Botão sino */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center justify-center h-9 w-9 rounded-full border border-[#261341] bg-[#050017] text-[#E5E7EB] hover:bg-white/5 transition"
      >
        <FiBell size={16} />
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 min-h-[16px] min-w-[16px] px-1 rounded-full bg-pink-500 text-[9px] font-semibold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown / painel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#261341] bg-[#050017] shadow-2xl z-50 overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1F1134]">
            <div>
              <p className="text-xs font-semibold text-white">Notificações</p>
              <p className="text-[10px] text-[#9CA3AF]">
                {loading
                  ? "Carregando..."
                  : hasUnread
                  ? `${unreadCount} não lida(s)`
                  : "Tudo em dia por aqui ✨"}
              </p>
            </div>
            {hasUnread && (
              <button
                type="button"
                onClick={async () => {
                  await markAllAsRead();
                }}
                className="text-[10px] text-[#C4B5FD] hover:text-white"
              >
                Marcar tudo como lido
              </button>
            )}
          </div>

          {/* lista */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 && !loading && (
              <div className="px-3 py-4 text-[11px] text-[#9CA3AF] text-center">
                Nenhuma notificação por enquanto.
              </div>
            )}

            {notifications.slice(0, 8).map((n) => {
              const isUnread = uid ? !n.readBy?.includes(uid) : false;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={async () => {
                    if (isUnread && uid) {
                      await markAsRead(n.id);
                    }
                    // futuro: navegar pro post / concorrente
                  }}
                  className={`w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-[#0B001F] transition ${
                    isUnread ? "bg-[#050017]" : "bg-transparent"
                  }`}
                >
                  {getIconForNotification(n)}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[11px] ${
                        isUnread ? "text-[#F9FAFB]" : "text-[#E5E7EB]"
                      }`}
                    >
                      {n.message}
                    </p>
                    <p className="text-[10px] text-[#6B7280] mt-0.5">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {isUnread && (
                    <span className="h-2 w-2 rounded-full bg-pink-500 mt-1.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* footer com link "Ver todas" */}
          <div className="border-t border-[#1F1134] px-3 py-2 flex items-center justify-between">
            <p className="text-[10px] text-[#6B7280]">
              Exibindo últimas{" "}
              {notifications.length > 8 ? "8+" : notifications.length}{" "}
              notificações
            </p>
            <Link
              href="/notificacoes"
              className="text-[10px] text-[#C4B5FD] hover:text-white font-medium"
              onClick={() => setOpen(false)}
            >
              Ver todas &gt;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
