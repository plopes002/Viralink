// src/firebase/savedCampaignTemplates.ts
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
  Firestore,
} from "firebase/firestore";
import type { SavedCampaignTemplate } from "@/types/savedCampaignTemplate";

const COLLECTION = "savedCampaignTemplates";

export async function createSavedCampaignTemplate(
  firestore: Firestore,
  data: Omit<SavedCampaignTemplate, "id">,
): Promise<string> {
  const ref = await addDoc(collection(firestore, COLLECTION), data as any);
  return ref.id;
}

export async function updateSavedCampaignTemplate(
  firestore: Firestore,
  id: string,
  data: Partial<SavedCampaignTemplate>,
): Promise<void> {
  const ref = doc(firestore, COLLECTION, id);
  await updateDoc(ref, data as any);
}

export async function deleteSavedCampaignTemplate(
  firestore: Firestore,
  id: string
): Promise<void> {
  const ref = doc(firestore, COLLECTION, id);
  await deleteDoc(ref);
}
