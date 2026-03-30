// src/app/api/instagram/comments/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { getPrimaryInstagramSocialAccountByWorkspaceId } from "@/lib/primaryInstagramAccount";
import { syncInstagramCommentsForSocialAccount } from "@/lib/instagramCommentsSync";

type CampaignAccount = {
  id: string;
  workspaceId: string;
  role: "primary" | "supporter" | string;
  name?: string;
  username?: string;
  socialAccountId?: string | null;
};

type SocialAccount = {
  id: string;
  network?: string;
  accountId?: string;
  instagramAccountId?: string;
  pageAccessToken?: string;
  accessToken?: string;
  name?: string;
  username?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId obrigatório." },
        { status: 400 }
      );
    }

    let inserted = 0;
    let updated = 0;

    // 1) sincroniza principal (mantém seu fluxo atual)
    const primarySocial = await getPrimaryInstagramSocialAccountByWorkspaceId(
      workspaceId
    );

    {
      const accessToken =
        primarySocial.pageAccessToken || primarySocial.accessToken || "";

      const result = await syncInstagramCommentsForSocialAccount({
        workspaceId,
        socialAccountId: primarySocial.id,
        accountId:
          primarySocial.accountId || (primarySocial as any).instagramAccountId,
        accessToken,
        sourceRole: "primary",
        sourceCampaignAccountId: null,
        sourceName: primarySocial.name || "Conta principal",
        sourceUsername: primarySocial.username || "",
      });

      inserted += result.inserted || 0;
      updated += result.updated || 0;
    }

    // 2) sincroniza apoiadores conectados
    const supportersSnap = await adminFirestore
      .collection("campaignAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("role", "==", "supporter")
      .get();

    const supporters = supportersSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    })) as CampaignAccount[];

    for (const supporter of supporters) {
      if (!supporter.socialAccountId) {
        continue;
      }

      const socialSnap = await adminFirestore
        .collection("socialAccounts")
        .doc(supporter.socialAccountId)
        .get();

      if (!socialSnap.exists) {
        continue;
      }

      const social = {
        id: socialSnap.id,
        ...(socialSnap.data() as any),
      } as SocialAccount;

      if (social.network !== "instagram") {
        continue;
      }

      const accessToken = social.pageAccessToken || social.accessToken || "";
      const accountId = social.accountId || social.instagramAccountId || "";

      if (!accountId || !accessToken) {
        continue;
      }

      const result = await syncInstagramCommentsForSocialAccount({
        workspaceId,
        socialAccountId: social.id,
        accountId,
        accessToken,
        sourceRole: "supporter",
        sourceCampaignAccountId: supporter.id,
        sourceName:
          supporter.name || social.name || social.username || "Apoiador",
        sourceUsername: supporter.username || social.username || "",
      });

      inserted += result.inserted || 0;
      updated += result.updated || 0;
    }

    return NextResponse.json({
      ok: true,
      inserted,
      updated,
    });
  } catch (error: any) {
    console.error("[instagram/comments/sync] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao sincronizar comentários." },
      { status: 500 }
    );
  }
}
