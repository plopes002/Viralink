// src/firebase/socialAccounts.ts
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  Firestore,
} from "firebase/firestore";
import type { SocialAccount, SocialNetwork } from "@/types/socialAccount";

const COLLECTION = "socialAccounts";

export async function createSocialAccount(
  firestore: Firestore,
  data: Omit<SocialAccount, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const now = new Date().toISOString();

  const ref = await addDoc(collection(firestore, COLLECTION), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  return ref.id;
}

export async function updateSocialAccount(
  firestore: Firestore,
  id: string,
  data: Partial<SocialAccount>,
): Promise<void> {
  const ref = doc(firestore, COLLECTION, id);

  await updateDoc(ref, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function listSocialAccountsByWorkspace(
  firestore: Firestore,
  workspaceId: string,
): Promise<SocialAccount[]> {
  const q = query(
    collection(firestore, COLLECTION),
    where("workspaceId", "==", workspaceId),
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  })) as SocialAccount[];
}

// util opcional: encontrar conta por rede
export function findAccountForNetwork(
  accounts: SocialAccount[],
  network: SocialNetwork,
): SocialAccount | undefined {
  return accounts.find((acc) => acc.network === network);
}
