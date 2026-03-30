// src/lib/ensureWorkspace.ts
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";

export async function ensureWorkspaceForUser(
  firestore: Firestore,
  userId: string
) {
  if (!firestore) {
    throw new Error("Firestore não disponível.");
  }

  if (!userId) {
    throw new Error("userId obrigatório.");
  }

  const workspacesRef = collection(firestore, "workspaces");
  const q = query(workspacesRef, where("ownerId", "==", userId));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const doc = snap.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  const newWorkspace = {
    ownerId: userId,
    name: "Meu workspace",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const createdRef = await addDoc(workspacesRef, newWorkspace);

  return {
    id: createdRef.id,
    ...newWorkspace,
  };
}
