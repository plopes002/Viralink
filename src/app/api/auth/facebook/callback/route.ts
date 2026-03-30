// src/app/api/auth/facebook/callback/route.ts
import { cookies } from "next/headers";
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

    // 🔥 1. TROCAR CODE POR TOKEN
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

// 🔥 2. GERAR LONG-LIVED TOKEN (60 dias)
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

// 👉 ESSE É O TOKEN FINAL (USE ESSE)
const userAccessToken = longTokenData.access_token;

// 🔥 3. PEGAR PÁGINAS (COM PAGE TOKEN)
const pagesRes = await fetch(
  `https://graph.facebook.com/v20.0/me/accounts` +
    `?fields=id,name,access_token,instagram_business_account` +
    `&access_token=${encodeURIComponent(userAccessToken)}`,
  { cache: "no-store" }
);

const pagesData = await pagesRes.json();

if (!pagesRes.ok || !pagesData.data) {
  throw new Error(
    pagesData?.error?.message || "Erro ao buscar páginas"
  );
}

    const page = pagesData.data[0];

    const pageId = page.id;
    const pageName = page.name;
    const pageAccessToken = page.access_token;

    const now = new Date().toISOString();

    // 🔥 3. SALVAR FACEBOOK CORRETO (PAGE TOKEN)
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
      isPrimary: mode === "primary",
      accessToken: userAccessToken, // guarda também
      pageAccessToken: pageAccessToken, // ⭐ ESSENCIAL
      createdAt: now,
      updatedAt: now,
    });

    // 🔥 4. SALVAR CAMPAIGN
    await adminFirestore.collection("campaignAccounts").add({
      workspaceId,
      role: "primary",
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

    // 🔥 5. INSTAGRAM (SE EXISTIR)
    if (page.instagram_business_account?.id) {
      const igId = page.instagram_business_account.id;

      const igRes = await fetch(
        `https://graph.facebook.com/v20.0/${igId}?fields=id,username,name,followers_count&access_token=${pageAccessToken}`,
        { cache: "no-store" }
      );

      const igData = await igRes.json();

      await adminFirestore.collection("socialAccounts").add({
        workspaceId,
        ownerUserId,
        network: "instagram",
        accountId: igId,
        username: igData.username || "",
        name: igData.name || "",
        followers: igData.followers_count || 0,
        accessToken: pageAccessToken,
        pageAccessToken: pageAccessToken,
        facebookPageId: pageId,
        facebookPageName: pageName,
        status: "connected",
        isPrimary: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    redirectUrl.searchParams.set("status", "success");
  } catch (error: any) {
    console.error("Erro Facebook callback:", error);
    redirectUrl.searchParams.set("error", error.message);
  }

  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set("fb_oauth_nonce", "", {
    maxAge: 0,
    path: "/",
  });

  return response;
}
