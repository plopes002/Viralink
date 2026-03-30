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

async function saveAccount(stateData: any, page: any) {
  const { workspaceId, ownerUserId, mode, token: inviteToken } = stateData;
  const now = new Date().toISOString();

  // Save Facebook Page as SocialAccount
  const fbSocialQuery = await adminFirestore
    .collection("socialAccounts")
    .where("workspaceId", "==", workspaceId)
    .where("network", "==", "facebook")
    .where("accountId", "==", page.id)
    .limit(1)
    .get();

  const fbSocialPayload: any = {
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
    updatedAt: now,
  };

  if (mode === "primary") {
    const primaryFbSnap = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("network", "==", "facebook")
      .where("isPrimary", "==", true)
      .limit(1)
      .get();
    if (primaryFbSnap.empty) {
      fbSocialPayload.isPrimary = true;
    }
  }

  let fbSocialAccountId: string;
  if (fbSocialQuery.empty) {
    fbSocialPayload.createdAt = now;
    const docRef = await adminFirestore.collection("socialAccounts").add(fbSocialPayload);
    fbSocialAccountId = docRef.id;
  } else {
    const docRef = fbSocialQuery.docs[0].ref;
    await docRef.update(fbSocialPayload);
    fbSocialAccountId = docRef.id;
  }

  // Save/Update CampaignAccount for Facebook
  const fbCampaignQuery = await adminFirestore
    .collection("campaignAccounts")
    .where("workspaceId", "==", workspaceId)
    .where("accountId", "==", page.id)
    .limit(1)
    .get();

  const fbCampaignPayload = {
    workspaceId,
    role: mode, // Use mode from state
    socialAccountId: fbSocialAccountId,
    name: page.name,
    network: "facebook",
    accountType: "page",
    accountId: page.id,
    status: "connected",
    ownerUserId,
    updatedAt: now,
  };
  
  if (fbCampaignQuery.empty) {
    await adminFirestore.collection("campaignAccounts").add({ ...fbCampaignPayload, createdAt: now });
  } else {
    await fbCampaignQuery.docs[0].ref.update(fbCampaignPayload);
  }

  // Handle associated Instagram account
  if (page.instagram_business_account?.id) {
    const igId = page.instagram_business_account.id;
    const igRes = await fetch(
      `https://graph.facebook.com/v20.0/${igId}?fields=id,username,name,followers_count&access_token=${page.access_token}`
    );
    const igData = await igRes.json();
    const pageName = page.name || "";
    const igUsername = igData.username || "";

    const igSocialQuery = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("network", "==", "instagram")
      .where("accountId", "==", igId)
      .limit(1)
      .get();

    const igSocialPayload: any = {
      workspaceId,
      ownerUserId,
      network: "instagram",
      accountId: igId,
      username: igUsername,
      name: igData.name || igUsername || pageName || "Instagram", // Fallback logic
      followers: igData.followers_count || 0,
      accessToken: page.access_token,
      pageAccessToken: page.access_token,
      facebookPageId: page.id,
      facebookPageName: pageName,
      status: "connected",
      updatedAt: now,
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
        igSocialPayload.isPrimary = true; // Set Instagram as primary too
      }
    }
    
    let igSocialAccountId: string;
    if (igSocialQuery.empty) {
        igSocialPayload.createdAt = now;
        const docRef = await adminFirestore.collection("socialAccounts").add(igSocialPayload);
        igSocialAccountId = docRef.id;
    } else {
        const docRef = igSocialQuery.docs[0].ref;
        await docRef.update(igSocialPayload);
        igSocialAccountId = docRef.id;
    }

    // Save/Update CampaignAccount for Instagram
    const igCampaignQuery = await adminFirestore
      .collection("campaignAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("accountId", "==", igId)
      .limit(1)
      .get();
      
    const igCampaignPayload = {
      workspaceId,
      role: mode, // Use mode from state
      socialAccountId: igSocialAccountId,
      name: igData.name || igUsername,
      username: igUsername,
      network: "instagram",
      accountId: igId,
      status: "connected",
      ownerUserId,
      updatedAt: now,
    };
    
    if (igCampaignQuery.empty) {
      await adminFirestore.collection("campaignAccounts").add({ ...igCampaignPayload, createdAt: now });
    } else {
      await igCampaignQuery.docs[0].ref.update(igCampaignPayload);
    }
  }

  // If supporter flow, update invite status
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
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const redirectUrl = new URL("/social-accounts", APP_URL);

  if (error) {
    redirectUrl.searchParams.set("error", error);
    redirectUrl.searchParams.set("error_description", errorDescription || "Unknown error");
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
      `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,followers_count}&access_token=${userAccessToken}`
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
      await saveAccount(stateData, { ...pages[0], access_token: userAccessToken });
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
    redirectUrl.pathname = "/social-accounts";
    redirectUrl.searchParams.set("error", err.message || "An unexpected error occurred.");
    return NextResponse.redirect(redirectUrl);
  } finally {
    // This part of the code might not be reached if a redirect happens inside the try block.
    // The redirect itself serves as the response.
    const finalResponse = NextResponse.redirect(redirectUrl);
    finalResponse.cookies.set("fb_oauth_nonce", "", { maxAge: -1 });
  }
}
