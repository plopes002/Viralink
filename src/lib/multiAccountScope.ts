// src/lib/multiAccountScope.ts
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function getMasterScopeWorkspaceIds(masterWorkspaceId: string) {
  const snap = await adminFirestore
    .collection("workspaceLinks")
    .where("masterWorkspaceId", "==", masterWorkspaceId)
    .where("status", "==", "active")
    .get();

  const childIds = snap.docs.map((d) => d.data().childWorkspaceId as string);

  return [masterWorkspaceId, ...childIds];
}

export async function getLinkedChildrenWithScopes(masterWorkspaceId: string) {
  const snap = await adminFirestore
    .collection("workspaceLinks")
    .where("masterWorkspaceId", "==", masterWorkspaceId)
    .where("status", "==", "active")
    .get();

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));
}
