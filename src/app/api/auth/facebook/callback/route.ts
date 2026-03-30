// src/app/api/auth/facebook/callback/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { randomUUID } from "crypto";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI!;
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://viramind.site";

async function saveAccount(
  { workspaceId, ownerUserId, mode, token: inviteToken }: any,
  page: any
) {
  const now = new Date().toISOString();
  const socialAccountPayload: any = {
    workspaceId,
    ownerUserId,
    network: "facebook",
    accountType: "page",
    accountId: page.id,
    facebookPageId: page.id,
    facebookPageName: page.name,
    name: page.name,
    status: "connected",
    accessToken: page.access_token,
    pageAccessToken: page.access_token,
    createdAt: now,
    updatedAt: now,
  };

  if (mode === "primary") {
    const primarySnap = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("network", "==", "facebook")
      .where("isPrimary", "==", true)
      .limit(1)
      .get();

    if (primarySnap.empty) {
      socialAccountPayload.isPrimary = true;
    }
  }

  const socialRef = await adminFirestore
    .collection("socialAccounts")
    .add(socialAccountPayload);

  // Lógica para conta de campanha
  const campaignPayload = {
    workspaceId,
    role: mode === "primary" ? "primary" : "supporter",
    socialAccountId: socialRef.id,
    name: page.name,
    network: "facebook",
    accountType: "page",
    accountId: page.id,
    status: "connected",
    ownerUserId,
    createdAt: now,
    updatedAt: now,
    ...(mode === "supporter" && {
      permissions: {
        allowContentBoost: true,
        allowLeadCapture: false,
        allowFollowerCampaigns: true,
      },
    }),
  };

  const campaignQuery = await adminFirestore
    .collection("campaignAccounts")
    .where("workspaceId", "==", workspaceId)
    .where("role", "==", mode)
    .where("network", "==", "facebook")
    .where("accountId", "==", page.id)
    .limit(1)
    .get();

  if (campaignQuery.empty) {
    await adminFirestore.collection("campaignAccounts").add(campaignPayload);
  } else {
    await campaignQuery.docs[0].ref.set(campaignPayload, { merge: true });
  }

  // Se for apoiador, atualiza o convite
  if (mode === "supporter" && inviteToken) {
    const inviteSnap = await adminFirestore
      .collection("supporterInvites")
      .where("token", "==", inviteToken)
      .limit(1)
      .get();
    if (!inviteSnap.empty) {
      await inviteSnap.docs[0].ref.update({
        status: "accepted",
        acceptedAt: now,
      });
    }
  }

  // Se a página tiver uma conta do Instagram
  if (page.instagram_business_account?.id) {
    const igId = page.instagram_business_account.id;
    const igRes = await fetch(
      `https://graph.facebook.com/v20.0/${igId}?fields=id,username,name,followers_count&access_token=${page.access_token}`
    );
    const igData = await igRes.json();

    const igPayload = {
      workspaceId,
      ownerUserId,
      network: "instagram",
      accountId: igId,
      username: igData.username || "",
      name: igData.name || "",
      followers: igData.followers_count || 0,
      accessToken: page.access_token,
      pageAccessToken: page.access_token,
      facebookPageId: page.id,
      facebookPageName: page.name,
      status: "connected",
      createdAt: now,
      updatedAt: now,
      isPrimary: false,
    };

    if (mode === "primary") {
      const primaryIgSnap = await adminFirestore
        .collection("socialAccounts")
        .where("workspaceId", "==", workspaceId)
        .where("network", "==", "instagram")
        .where("isPrimary", "==", true)
        .limit(1)
        .get();
      if (primaryIgSnap.empty) {
        igPayload.isPrimary = true;
      }
    }
    await adminFirestore.collection("socialAccounts").add(igPayload);
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorReason = url.searchParams.get("error_reason");
  const errorDescription = url.searchParams.get("error_description");

  const redirectUrl = new URL("/social-accounts", APP_URL);

  if (error) {
    redirectUrl.searchParams.set("error", error);
    redirectUrl.searchParams.set("error_description", errorDescription || errorReason || "Unknown error");
    return NextResponse.redirect(redirectUrl);
  }

  const cookieStore = cookies();
  const savedNonce = cookieStore.get("fb_oauth_nonce")?.value;

  try {
    if (!code || !state) {
      throw new Error("Invalid request: code or state missing.");
    }
    
    const stateData = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
    
    if (stateData.nonce !== savedNonce) {
      throw new Error("Invalid state: nonce mismatch.");
    }

    const tokenRes = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData?.error?.message || "Failed to exchange code for token.");
    }

    const longTokenRes = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    );
    const longTokenData = await longTokenRes.json();
    if (!longTokenRes.ok || !longTokenData.access_token) {
      throw new Error(longTokenData?.error?.message || "Failed to get long-lived token.");
    }
    
    const userAccessToken = longTokenData.access_token;
    
    const accountsRes = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userAccessToken}`
    );
    const accountsData = await accountsRes.json();
    if (!accountsRes.ok || !accountsData.data) {
      throw new Error(accountsData?.error?.message || "Failed to fetch pages.");
    }

    const pages = accountsData.data.filter(
      (p: any) =>
        (stateData.allowPages && p.id) ||
        (stateData.allowProfile && p.instagram_business_account)
    );

    if (pages.length === 0) {
      throw new Error("No compatible pages or Instagram accounts found.");
    }

    if (pages.length === 1) {
      await saveAccount(stateData, pages[0]);
      redirectUrl.searchParams.set("status", "success");
      return NextResponse.redirect(redirectUrl);
    }
    
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    
    await adminFirestore
      .collection("facebookPageSelections")
      .doc(sessionId)
      .set({
        ...stateData,
        status: "pending",
        userAccessToken,
        pages,
        createdAt: new Date().toISOString(),
        expiresAt,
      });

    redirectUrl.pathname = "/social-accounts/select-facebook-page";
    redirectUrl.searchParams.set("session", sessionId);
    return NextResponse.redirect(redirectUrl);

  } catch (err: any) {
    console.error("Facebook callback error:", err);
    redirectUrl.searchParams.set("error", err.message || "An unexpected error occurred.");
    return NextResponse.redirect(redirectUrl);
  } finally {
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("fb_oauth_nonce", "", { maxAge: 0 });
  }
}
