// src/firebase/automations.ts
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
import type { AutomationRule } from "@/types/automation";

const COLLECTION = "automations";

export async function createAutomation(
  firestore: Firestore,
  data: Omit<AutomationRule, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const now = new Date().toISOString();

  const ref = await addDoc(collection(firestore, COLLECTION), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  return ref.id;
}

export async function updateAutomation(
  firestore: Firestore,
  id: string,
  data: Partial<AutomationRule>,
): Promise<void> {
  const ref = doc(firestore, COLLECTION, id);

  await updateDoc(ref, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function listAutomationsByWorkspace(
  firestore: Firestore,
  workspaceId: string,
): Promise<AutomationRule[]> {
  const q = query(
    collection(firestore, COLLECTION),
    where("workspaceId", "==", workspaceId),
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  })) as AutomationRule[];
}
