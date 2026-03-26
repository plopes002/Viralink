// src/firebase/contactHistory.ts
import { addDoc, collection, Firestore } from "firebase/firestore";
import type { ContactHistoryItem } from "@/types/contactHistory";

const COLLECTION = "contactHistory";

export async function createContactHistory(
  firestore: Firestore,
  data: Omit<ContactHistoryItem, "id">,
): Promise<string> {
  const ref = await addDoc(collection(firestore, COLLECTION), data as any);
  return ref.id;
}
