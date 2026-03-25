// src/firebase/engagementProfiles.ts
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  Firestore,
} from "firebase/firestore";
import type { EngagementProfile } from "@/types/engagementProfile";

const COLLECTION = "engagementProfiles";

export async function upsertEngagementProfile(
  firestore: Firestore,
  profile: Omit<EngagementProfile, "id" | "createdAt" | "updatedAt">,
) {
  const now = new Date().toISOString();

  const profileId = `${profile.workspaceId}_${profile.socialAccountId}_${profile.username}`;

  await setDoc(
    doc(firestore, COLLECTION, profileId),
    {
      ...profile,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  return profileId;
}

export async function getEngagementsByUser(
  firestore: Firestore,
  workspaceId: string,
  socialAccountId: string,
  username: string,
) {
  const q = query(
    collection(firestore, "engagements"),
    where("workspaceId", "==", workspaceId),
    where("socialAccountId", "==", socialAccountId),
    where("username", "==", username),
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));
}
