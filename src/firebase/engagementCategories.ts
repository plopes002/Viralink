
// src/firebase/engagementCategories.ts
import { doc, updateDoc, arrayUnion, arrayRemove, Firestore } from "firebase/firestore";

export async function addCategoryToEngagement(
  firestore: Firestore,
  engagementId: string,
  categorySlug: string,
) {
  const ref = doc(firestore, "engagements", engagementId);
  await updateDoc(ref, {
    categories: arrayUnion(categorySlug),
  });
}

export async function removeCategoryFromEngagement(
  firestore: Firestore,
  engagementId: string,
  categorySlug: string,
) {
  const ref = doc(firestore, "engagements", engagementId);
  await updateDoc(ref, {
    categories: arrayRemove(categorySlug),
  });
}
