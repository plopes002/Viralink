// src/hooks/useNotifications.ts
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  Firestore,
} from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import type { Notification } from "@/types/notification";

export function useNotifications(workspaceId: string | null, uid: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const db = useFirestore();

  useEffect(() => {
    if (!workspaceId || !uid || !db) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "notifications"),
      where("workspaceId", "==", workspaceId),
      orderBy("createdAt", "desc"),
      limit(30),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Notification[] = snapshot.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            workspaceId: data.workspaceId,
            type: data.type,
            postId: data.postId,
            channels: data.channels || [],
            message: data.message,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : new Date(),
            readBy: data.readBy || [],
          };
        });
        setNotifications(items);
        setLoading(false);
      },
      (err) => {
        console.error("[useNotifications] erro no snapshot", err);
        setError(err as Error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [workspaceId, uid, db]);

  const unreadCount = useMemo(() => {
    if (!uid) return 0;
    return notifications.filter(
      (n) => !n.readBy?.includes(uid),
    ).length;
  }, [notifications, uid]);


  async function markAsRead(notificationId: string) {
    if (!uid || !db) return;
    const ref = doc(db, "notifications", notificationId);
    try {
        await updateDoc(ref, {
          readBy: arrayUnion(uid),
        });
    } catch(e) {
        console.error("Failed to mark notification as read", e);
    }
  }

  async function markAllAsRead() {
    if (!uid || !db) return;
    const batchPromises = notifications
      .filter((n) => !n.readBy?.includes(uid))
      .map((n) =>
        updateDoc(doc(db, "notifications", n.id), {
          readBy: arrayUnion(uid),
        }),
      );
    try {
        await Promise.all(batchPromises);
    } catch (e) {
        console.error("Failed to mark all notifications as read", e);
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  };
}
