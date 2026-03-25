// src/firebase/contactCategories.ts
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  Firestore,
} from "firebase/firestore";
import type { ContactCategory } from "@/types/contactCategory";

const COLLECTION = "contactCategories";

export async function createContactCategory(
  firestore: Firestore,
  data: Omit<ContactCategory, "id">,
): Promise<string> {
  const ref = await addDoc(collection(firestore, COLLECTION), data as any);
  return ref.id;
}

export async function updateContactCategory(
  firestore: Firestore,
  id: string,
  data: Partial<ContactCategory>,
): Promise<void> {
  const ref = doc(firestore, COLLECTION, id);
  await updateDoc(ref, data as any);
}
