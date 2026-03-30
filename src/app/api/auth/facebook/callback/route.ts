// src/app/api/auth/facebook/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI!;
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://viramind.site";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const redirectUrl = new URL("/social-accounts", APP_URL);

  if (!code || !state) {
    redirectUrl.searchParams.set("error", "invalid_request");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const stateData = JSON.parse(
      Buffer.from(state, "base64").toString("utf8")
    );

    const { workspaceId, ownerUserId, mode } = stateData;

    const tokenRes = await fetch(
      "https://graph.facebook.com/v20.0/oauth/access_token" +
        `?client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
        `&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}` +
        `&client_secret=${encodeURIComponent(FACEBOOK_APP_SECRET)}` +
        `&code=${encodeURIComponent(code)}`,
      { cache: "no-store" }
    );

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(
        tokenData?.error?.message || "Erro ao obter access token"
      );
    }

    const longTokenUrl =
      "https://graph.facebook.com/v20.0/oauth/access_token" +
      `?grant_type=fb_exchange_token` +
      `&client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
      `&client_secret=${encodeURIComponent(FACEBOOK_APP_SECRET)}` +
      `&fb_exchange_token=${encodeURIComponent(tokenData.access_token)}`;

    const longTokenRes = await fetch(longTokenUrl, { cache: "no-store" });
    const longTokenData = await longTokenRes.json();

    if (!longTokenRes.ok || !longTokenData.access_token) {
      throw new Error(
        longTokenData?.error?.message || "Erro ao gerar long-lived token"
      );
    }

    const userAccessToken = longTokenData.access_token;

    const pagesRes = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts` +
        `?fields=id,name,access_token,instagram_business_account` +
        `&access_token=${encodeURIComponent(userAccessToken)}`,
      { cache: "no-store" }
    );

    const pagesData = await pagesRes.json();

    if (!pagesRes.ok || !pagesData.data?.length) {
      throw new Error(pagesData?.error?.message || "Erro ao buscar páginas");
    }

    // Mantido como está no seu fluxo atual.
    // Depois a gente pode evoluir para usar a página selecionada na session.
    const page = pagesData.data[0];

    const pageId = String(page.id || "");
    const pageName = String(page.name || "Página do Facebook");
    const pageAccessToken = String(page.access_token || "");

    if (!pageId || !pageAccessToken) {
      throw new Error("Página do Facebook inválida ou sem token.");
    }

    const now = new Date().toISOString();

    const primaryFbSnap = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("network", "==", "facebook")
      .where("isPrimary", "==", true)
      .limit(1)
      .get();

    const shouldSetFacebookPrimary =
      mode === "primary" && primaryFbSnap.empty;

    const socialRef = await adminFirestore.collection("socialAccounts").add({
      workspaceId,
      ownerUserId,
      network: "facebook",
      accountType: "page",
      accountId: pageId,
      facebookPageId: pageId,
      facebookPageName: pageName,
      name: pageName,
      username: "",
      status: "connected",
      followers: 0,
      isPrimary: shouldSetFacebookPrimary,
      accessToken: userAccessToken,
      pageAccessToken: pageAccessToken,
      createdAt: now,
      updatedAt: now,
    });

    await adminFirestore.collection("campaignAccounts").add({
      workspaceId,
      role: shouldSetFacebookPrimary ? "primary" : "supporter",
      socialAccountId: socialRef.id,
      name: pageName,
      network: "facebook",
      accountType: "page",
      accountId: pageId,
      status: "connected",
      ownerUserId,
      createdAt: now,
      updatedAt: now,
    });

    if (page.instagram_business_account?.id) {
      const igId = String(page.instagram_business_account.id);

      const igRes = await fetch(
        `https://graph.facebook.com/v20.0/${igId}?fields=id,username,name,followers_count&access_token=${encodeURIComponent(pageAccessToken)}`,
        { cache: "no-store" }
      );

      const igData = await igRes.json();

      if (!igRes.ok || igData?.error) {
        throw new Error(
          igData?.error?.message || "Erro ao buscar conta do Instagram"
        );
      }

      const primaryIgSnap = await adminFirestore
        .collection("socialAccounts")
        .where("workspaceId", "==", workspaceId)
        .where("network", "==", "instagram")
        .where("isPrimary", "==", true)
        .limit(1)
        .get();

      const shouldSetInstagramPrimary =
        mode === "primary" && primaryIgSnap.empty;

      const instagramName =
        String(igData.name || "").trim() ||
        String(igData.username || "").trim() ||
        pageName ||
        "Instagram";

      const instagramUsername = String(igData.username || "").trim();

      await adminFirestore.collection("socialAccounts").add({
        workspaceId,
        ownerUserId,
        network: "instagram",
        accountId: igId,
        username: instagramUsername,
        name: instagramName,
        followers: Number(igData.followers_count || 0),
        accessToken: pageAccessToken,
        pageAccessToken: pageAccessToken,
        facebookPageId: pageId,
        facebookPageName: pageName,
        status: "connected",
        isPrimary: shouldSetInstagramPrimary,
        createdAt: now,
        updatedAt: now,
      });
    }

    redirectUrl.searchParams.set("status", "success");
  } catch (error: any) {
    console.error("Erro Facebook callback:", error);
    redirectUrl.searchParams.set("error", error?.message || "Erro interno");
  }

  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set("fb_oauth_nonce", "", {
    maxAge: 0,
    path: "/",
  });

  return response;
}
