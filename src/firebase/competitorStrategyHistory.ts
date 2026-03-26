// src/firebase/competitorStrategyHistory.ts
import { addDoc, collection, Firestore } from "firebase/firestore";

export async function saveCompetitorStrategyHistory(firestore: Firestore, data: any) {
  await addDoc(collection(firestore, "competitorStrategyHistory"), data);
}
