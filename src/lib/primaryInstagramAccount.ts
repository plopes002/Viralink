// src/lib/primaryInstagramAccount.ts
import "server-only";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function getPrimaryInstagramSocialAccountByWorkspaceId(
  workspaceId: string,
) {
  // Query for primary instagram account
  let socialSnap = await adminFirestore
    .collection("socialAccounts")
    .where("workspaceId", "==", workspaceId)
    .where("network", "==", "instagram")
    .where("isPrimary", "==", true)
    .limit(1)
    .get();

  // If no primary, look for any connected instagram account
  if (socialSnap.empty) {
    socialSnap = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("network", "==", "instagram")
      .where("status", "==", "connected")
      .limit(1)
      .get();
  }

  if (socialSnap.empty) {
    throw new Error(
      "Nenhuma conta principal ou conectada do Instagram encontrada para este workspace.",
    );
  }

  const socialDoc = socialSnap.docs[0];

  return {
    id: socialDoc.id,
    ...(socialDoc.data() as any),
  };
}
