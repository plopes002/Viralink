// src/lib/primaryInstagramAccount.ts
import "server-only";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function getPrimaryInstagramSocialAccountByWorkspaceId(
  workspaceId: string
) {
  const primaryCampaignSnap = await adminFirestore
    .collection("campaignAccounts")
    .where("workspaceId", "==", workspaceId)
    .where("role", "==", "primary")
    .limit(1)
    .get();

  if (primaryCampaignSnap.empty) {
    throw new Error("Conta principal não encontrada.");
  }

  const primaryCampaign = primaryCampaignSnap.docs[0].data() as any;
  const socialAccountId = primaryCampaign.socialAccountId;

  if (!socialAccountId) {
    throw new Error("Conta principal sem socialAccountId.");
  }

  const socialDoc = await adminFirestore
    .collection("socialAccounts")
    .doc(socialAccountId)
    .get();

  if (!socialDoc.exists) {
    throw new Error("Social account principal não encontrada.");
  }

  return {
    id: socialDoc.id,
    ...(socialDoc.data() as any),
  };
}