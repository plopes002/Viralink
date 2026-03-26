// src/firebase/workspaceLinks.ts
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  setDoc,
  Firestore,
} from "firebase/firestore";
import type { WorkspaceLinkItem } from "@/types/workspaceLink";
import type { WorkspaceInviteItem } from "@/types/workspaceInvite";

export async function createWorkspaceInvite(
  firestore: Firestore,
  data: Omit<WorkspaceInviteItem, "id">,
) {
  const ref = await addDoc(collection(firestore, "workspaceInvites"), data as any);
  return ref.id;
}

export async function createWorkspaceLink(
  firestore: Firestore,
  data: Omit<WorkspaceLinkItem, "id">,
) {
  const ref = await addDoc(collection(firestore, "workspaceLinks"), data as any);
  return ref.id;
}

export async function updateWorkspaceLink(
  firestore: Firestore,
  linkId: string,
  data: Partial<WorkspaceLinkItem>,
) {
  await updateDoc(doc(firestore, "workspaceLinks", linkId), data as any);
}

export async function updateWorkspaceInvite(
  firestore: Firestore,
  inviteId: string,
  data: Partial<WorkspaceInviteItem>,
) {
  await updateDoc(doc(firestore, "workspaceInvites", inviteId), data as any);
}

export async function ensureWorkspaceKind(
  firestore: Firestore,
  workspaceId: string,
  kind: "standalone" | "master" | "child",
) {
  await setDoc(
    doc(firestore, "workspaces", workspaceId),
    {
      kind,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}
