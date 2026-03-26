// src/firebase/campaigns.ts
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  Firestore,
} from "firebase/firestore";
import type { Campaign } from "@/types/campaign";

const COLLECTION = "campaigns";

export async function createCampaign(
  firestore: Firestore,
  data: Omit<Campaign, "id">,
): Promise<string> {
  const ref = await addDoc(collection(firestore, COLLECTION), data as any);
  return ref.id;
}

export async function updateCampaign(
  firestore: Firestore,
  id: string,
  data: Partial<Campaign>,
): Promise<void> {
  const ref = doc(firestore, COLLECTION, id);
  await updateDoc(ref, data as any);
}
