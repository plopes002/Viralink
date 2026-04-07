
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

    const {
      workspaceId,
      ownerUserId,
      mode,
      network,
      accountType,
      allowProfile,
      allowPages,
    } = stateData;

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
        `?fields=id,name,access_token,instagram_business_account{id,username,name,followers_count}` +
        `&access_token=${encodeURIComponent(userAccessToken)}`,
      { cache: "no-store" }
    );

    const pagesData = await pagesRes.json();

    if (!pagesRes.ok || !Array.isArray(pagesData.data)) {
      throw new Error(
        pagesData?.error?.message || "Erro ao buscar páginas"
      );
    }

    const pages = pagesData.data;

    if (!pages.length) {
      throw new Error("Nenhuma página encontrada nesta conta.");
    }

    const now = new Date().toISOString();

    // Se houver mais de uma página, cria sessão de seleção
    if (pages.length > 1) {
      const sessionRef = await adminFirestore
        .collection("facebookPageSelections")
        .add({
          workspaceId,
          ownerUserId,
          mode,
          network: network || "instagram",
          accountType: accountType || "page",
          allowProfile: !!allowProfile,
          allowPages: !!allowPages,
          userAccessToken,
          pages,
          status: "pending",
          createdAt: now,
          updatedAt: now,
          expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
        });

      const selectionUrl = new URL(
        `/social-accounts/select-facebook-page?session=${encodeURIComponent(
          sessionRef.id
        )}`,
        APP_URL
      );

      return NextResponse.redirect(selectionUrl);
    }

    // Fluxo direto se só existir uma página
    const selectedPage = pages[0];
    const pageId = String(selectedPage.id || "");
    const pageName = String(selectedPage.name || "Página do Facebook");
    const pageAccessToken = String(selectedPage.access_token || "");

    if (!pageId || !pageAccessToken) {
      throw new Error("Página inválida ou sem token.");
    }

    const socialAccountQuery = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("network", "==", "facebook")
      .where("accountId", "==", pageId)
      .limit(1)
      .get();

    const socialPayload: any = {
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
      accessToken: userAccessToken,
      pageAccessToken,
      updatedAt: now,
    };

    if (mode === "primary") {
      const primaryFbQuery = await adminFirestore
        .collection("socialAccounts")
        .where("workspaceId", "==", workspaceId)
        .where("isPrimary", "==", true)
        .where("network", "==", "facebook")
        .limit(1)
        .get();

      if (primaryFbQuery.empty) {
        socialPayload.isPrimary = true;
      }
    }

    let socialAccountId: string;

    if (socialAccountQuery.empty) {
      socialPayload.createdAt = now;
      const docRef = await adminFirestore
        .collection("socialAccounts")
        .add(socialPayload);
      socialAccountId = docRef.id;
    } else {
      const docRef = socialAccountQuery.docs[0].ref;
      await docRef.update(socialPayload);
      socialAccountId = docRef.id;
    }

    const campaignQuery = await adminFirestore
      .collection("campaignAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("accountId", "==", pageId)
      .limit(1)
      .get();

    const campaignPayload = {
      workspaceId,
      role: mode,
      socialAccountId,
      name: pageName,
      network: "facebook",
      accountType: "page",
      accountId: pageId,
      status: "connected",
      ownerUserId,
      updatedAt: now,
    };

    if (campaignQuery.empty) {
      await adminFirestore
        .collection("campaignAccounts")
        .add({ ...campaignPayload, createdAt: now });
    } else {
      await campaignQuery.docs[0].ref.update(campaignPayload);
    }

    if (selectedPage.instagram_business_account?.id) {
      const igData = selectedPage.instagram_business_account;
      const igId = String(igData.id || "");
      const igUsername = String(igData.username || "").trim();

      const igQuery = await adminFirestore
        .collection("socialAccounts")
        .where("workspaceId", "==", workspaceId)
        .where("network", "==", "instagram")
        .where("accountId", "==", igId)
        .limit(1)
        .get();

      const igPayload: any = {
        workspaceId,
        ownerUserId,
        network: "instagram",
        accountId: igId,
        username: igUsername,
        name:
          String(igData.name || "").trim() ||
          igUsername ||
          pageName ||
          "Instagram",
        followers: Number(igData.followers_count || 0),
        accessToken: pageAccessToken,
        pageAccessToken: pageAccessToken,
        facebookPageId: pageId,
        facebookPageName: pageName,
        status: "connected",
        updatedAt: now,
      };

      if (mode === "primary") {
        const primaryIgQuery = await adminFirestore
          .collection("socialAccounts")
          .where("workspaceId", "==", workspaceId)
          .where("network", "==", "instagram")
          .where("isPrimary", "==", true)
          .limit(1)
          .get();

        if (primaryIgQuery.empty) {
          igPayload.isPrimary = true;
        }
      }

      let igSocialAccountId: string;

      if (igQuery.empty) {
        igPayload.createdAt = now;
        const docRef = await adminFirestore
          .collection("socialAccounts")
          .add(igPayload);
        igSocialAccountId = docRef.id;
      } else {
        const docRef = igQuery.docs[0].ref;
        await docRef.update(igPayload);
        igSocialAccountId = docRef.id;
      }

      const igCampaignQuery = await adminFirestore
        .collection("campaignAccounts")
        .where("workspaceId", "==", workspaceId)
        .where("accountId", "==", igId)
        .limit(1)
        .get();

      const igCampaignPayload = {
        workspaceId,
        role: mode,
        socialAccountId: igSocialAccountId,
        name:
          String(igData.name || "").trim() ||
          igUsername ||
          pageName ||
          "Instagram",
        username: igUsername,
        network: "instagram",
        accountId: igId,
        status: "connected",
        ownerUserId,
        updatedAt: now,
      };

      if (igCampaignQuery.empty) {
        await adminFirestore
          .collection("campaignAccounts")
          .add({ ...igCampaignPayload, createdAt: now });
      } else {
        await igCampaignQuery.docs[0].ref.update(igCampaignPayload);
      }
    }

    redirectUrl.searchParams.set("status", "success");
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error("[facebook callback] erro:", error);
    redirectUrl.searchParams.set("error", error?.message || "Erro interno");
    return NextResponse.redirect(redirectUrl);
  }
}
