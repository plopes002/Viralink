// src/app/api/facebook/comments/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { syncFacebookCommentsForSocialAccount } from "@/lib/facebookCommentsSync";

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
  facebookPageId?: string;
  pageAccessToken?: string;
  accessToken?: string;
  name?: string;
  username?: string;
  isPrimary?: boolean;
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

    const primarySnap = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("network", "==", "facebook")
      .where("isPrimary", "==", true)
      .limit(1)
      .get();

    if (!primarySnap.empty) {
      const primarySocial = {
        id: primarySnap.docs[0].id,
        ...(primarySnap.docs[0].data() as any),
      } as SocialAccount;

      const accessToken = primarySocial.pageAccessToken || "";
      const accountId =
        primarySocial.facebookPageId || primarySocial.accountId || "";

      if (accessToken && accountId) {
        const result = await syncFacebookCommentsForSocialAccount({
          workspaceId,
          socialAccountId: primarySocial.id,
          accountId,
          accessToken,
          sourceRole: "primary",
          sourceCampaignAccountId: null,
          sourceName: primarySocial.name || "Conta principal",
          sourceUsername: primarySocial.username || "",
        });

        inserted += result.inserted || 0;
        updated += result.updated || 0;
      } else {
        console.error(
          "[facebook/comments/sync] principal sem page token ou page id",
          {
            socialId: primarySocial.id,
            name: primarySocial.name,
            hasPageAccessToken: !!primarySocial.pageAccessToken,
            accountId: primarySocial.accountId,
            facebookPageId: primarySocial.facebookPageId,
          }
        );
      }
    }

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

      if (social.network !== "facebook") {
        continue;
      }

      const accessToken = social.pageAccessToken || "";
      const accountId = social.facebookPageId || social.accountId || "";

      if (!accountId || !accessToken) {
        console.error(
          "[facebook/comments/sync] apoiador sem page token ou page id",
          {
            socialId: social.id,
            supporterId: supporter.id,
            name: social.name,
            hasPageAccessToken: !!social.pageAccessToken,
            hasAccessToken: !!social.accessToken,
            accountId: social.accountId,
            facebookPageId: social.facebookPageId,
          }
        );
        continue;
      }

      const result = await syncFacebookCommentsForSocialAccount({
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
    console.error("[facebook/comments/sync] erro:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao sincronizar comentários do Facebook.",
      },
      { status: 500 }
    );
  }
}