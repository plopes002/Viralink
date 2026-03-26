// src/firebase/contacts.ts
import {
  addDoc,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  Firestore,
} from "firebase/firestore";
import type { ContactItem } from "@/types/contact";

const COLLECTION = "contacts";

export async function createContact(
  firestore: Firestore,
  data: Omit<ContactItem, "id">,
): Promise<string> {
  const ref = await addDoc(collection(firestore, COLLECTION), data as any);
  return ref.id;
}

export async function upsertContactById(
  firestore: Firestore,
  id: string,
  data: Omit<ContactItem, "id">,
): Promise<void> {
  await setDoc(doc(firestore, COLLECTION, id), data as any, { merge: true });
}

export async function updateContact(
  firestore: Firestore,
  id: string,
  data: Partial<ContactItem>,
): Promise<void> {
  await updateDoc(doc(firestore, COLLECTION, id), data as any);
}

export async function deleteContact(
  firestore: Firestore,
  id: string
): Promise<void> {
  await deleteDoc(doc(firestore, COLLECTION, id));
}
