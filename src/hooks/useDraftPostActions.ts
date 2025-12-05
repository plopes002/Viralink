// src/hooks/useDraftPostActions.ts
"use client";

import { useFirebase } from "@/firebase/provider";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export type MediaType = "image" | "video" | "none";

export interface DraftPayload {
  workspaceId: string;
  ownerId: string;
  networks: string[]; // ["instagram", "facebook", "whatsapp"]
  text: string;
  mediaType: MediaType;
  mediaUrl?: string | null;
}

export function useDraftPostActions() {
  const { firestore: db } = useFirebase();

  if (!db) {
    // em produção você pode tratar com algo mais elegante
    console.warn("[useDraftPostActions] Firestore não disponível");
  }

  async function createDraft(payload: DraftPayload) {
    if (!db) return;

    const ref = collection(db, "draftPosts");
    await addDoc(ref, {
      workspaceId: payload.workspaceId,
      ownerId: payload.ownerId,
      networks: payload.networks,
      content: {
        text: payload.text,
        mediaType: payload.mediaType,
        mediaUrl: payload.mediaUrl ?? null,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function updateDraft(draftId: string, payload: DraftPayload) {
    if (!db) return;

    const ref = doc(db, "draftPosts", draftId);
    await updateDoc(ref, {
      networks: payload.networks,
      content: {
        text: payload.text,
        mediaType: payload.mediaType,
        mediaUrl: payload.mediaUrl ?? null,
      },
      updatedAt: serverTimestamp(),
    });
  }

  return {
    createDraft,
    updateDraft,
  };
}
