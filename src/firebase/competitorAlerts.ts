// src/firebase/competitorAlerts.ts
import { addDoc, collection, doc, updateDoc, Firestore } from "firebase/firestore";

export async function createCompetitorAlert(firestore: Firestore, data: any) {
  const ref = await addDoc(collection(firestore, "competitorAlerts"), data);
  return ref.id;
}

export async function markCompetitorAlertAsRead(firestore: Firestore, id: string) {
  await updateDoc(doc(firestore, "competitorAlerts", id), {
    isRead: true,
  });
}