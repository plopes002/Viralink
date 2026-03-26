
// src/firebase/engagementOperationalTags.ts
import { doc, updateDoc, arrayUnion, arrayRemove, Firestore } from "firebase/firestore";

export async function addOperationalTag(
  firestore: Firestore,
  engagementId: string,
  tag: string,
) {
  const ref = doc(firestore, "engagements", engagementId);
  await updateDoc(ref, {
    operationalTags: arrayUnion(tag),
  });
}

export async function removeOperationalTag(
  firestore: Firestore,
  engagementId: string,
  tag: string,
) {
  const ref = doc(firestore, "engagements", engagementId);
  await updateDoc(ref, {
    operationalTags: arrayRemove(tag),
  });
}
