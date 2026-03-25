// src/firebase/engagements.ts
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  Firestore,
} from "firebase/firestore";
import type { EngagementItem } from "@/types/engagement";

const COLLECTION = "engagements";

export async function createEngagement(
  firestore: Firestore,
  data: Omit<EngagementItem, "id">,
): Promise<string> {
  const ref = await addDoc(collection(firestore, COLLECTION), data as any);
  return ref.id;
}

export async function updateEngagement(
  firestore: Firestore,
  id: string,
  data: Partial<EngagementItem>,
): Promise<void> {
  const ref = doc(firestore, COLLECTION, id);
  await updateDoc(ref, data as any);
}
