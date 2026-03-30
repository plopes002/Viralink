// src/app/api/dashboard/insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

type SupportedNetwork = "instagram" | "facebook" | "whatsapp";
type SocialAccountDoc = {
  workspaceId: string;
  network: SupportedNetwork;
  accountType?: "profile" | "page";
  accountId?: string;
  facebookPageId?: string;
  username?: string;
  name?: string;
  followers?: number;
  accessToken?: string;
  pageAccessToken?: string;
  status?: string;
  isPrimary?: boolean;
};

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

async function getConnectedAccounts(
  workspaceId: string,
  network?: string | null,
  socialAccountId?: string | null
) {
  if (socialAccountId) {
    const doc = await adminFirestore.collection("socialAccounts").doc(socialAccountId).get();

    if (!doc.exists) return [];

    const data = doc.data() as SocialAccountDoc;

    if (data.workspaceId !== workspaceId) return [];
    if (data.status !== "connected") return [];
    if (network && network !== "all" && data.network !== network) return [];

    return [{ id: doc.id, ...data }];
  }

  let query: FirebaseFirestore.Query = adminFirestore
    .collection("socialAccounts")
    .where("workspaceId", "==", workspaceId)
    .where("status", "==", "connected");

  if (network && network !== "all") {
    query = query.where("network", "==", network);
  }

  const snap = await query.get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as SocialAccountDoc),
  }));
}

async function loadInstagramInsights(account: { id: string } & SocialAccountDoc) {
  const instagramId = account.accountId;
  const accessToken = account.pageAccessToken || account.accessToken || "";

  if (!instagramId || !accessToken) {
    return {
      followers_count: toNumber(account.followers, 0),
      media_count: 0,
      username: account.username || "",
    };
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(
      instagramId
    )}?fields=followers_count,media_count,username&access_token=${encodeURIComponent(
      accessToken
    )}`,
    { cache: "no-store" }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Falha ao buscar insights do Instagram");
  }

  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);

  await adminFirestore
    .collection("instagramInsightsHistory")
    .doc(`${account.workspaceId}_${account.id}_${dateKey}`)
    .set(
      {
        workspaceId: account.workspaceId,
        socialAccountId: account.id,
        accountId: instagramId,
        username: data.username || account.username || "",
        followersCount: data.followers_count || 0,
        mediaCount: data.media_count || 0,
        dateKey,
        capturedAt: now.toISOString(),
      },
      { merge: true }
    );

  return {
    followers_count: toNumber(data.followers_count, 0),
    media_count: toNumber(data.media_count, 0),
    username: data.username || account.username || "",
  };
}

async function loadFacebookInsights(account: { id: string } & SocialAccountDoc) {
  const pageId = account.facebookPageId || account.accountId;
  const accessToken = account.pageAccessToken || account.accessToken || "";

  if (!pageId || !accessToken) {
    return {
      followers_count: toNumber(account.followers, 0),
      media_count: 0,
      username: account.name || "",
    };
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(
      pageId
    )}?fields=id,name,followers_count&access_token=${encodeURIComponent(accessToken)}`,
    { cache: "no-store" }
  );

  const data = await response.json();

  const followersCount = response.ok
    ? toNumber(data.followers_count, toNumber(account.followers, 0))
    : toNumber(account.followers, 0);

  const pageName = response.ok
    ? data.name || account.name || ""
    : account.name || "";

  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);

  await adminFirestore
    .collection("facebookInsightsHistory")
    .doc(`${account.workspaceId}_${account.id}_${dateKey}`)
    .set(
      {
        workspaceId: account.workspaceId,
        socialAccountId: account.id,
        accountId: pageId,
        pageName,
        followersCount,
        mediaCount: 0,
        dateKey,
        capturedAt: now.toISOString(),
      },
      { merge: true }
    );

  return {
    followers_count: followersCount,
    media_count: 0,
    username: pageName,
  };
}

function isInteractionReplied(item: any) {
  const values = [
    item?.status,
    item?.replyStatus,
    item?.messageStatus,
    item?.interactionStatus,
  ]
    .map((v) => String(v || "").toLowerCase())
    .filter(Boolean);

  return values.some((v) =>
    ["replied", "responded", "answered", "done", "success"].includes(v)
  );
}

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const network = req.nextUrl.searchParams.get("network");
    const socialAccountId = req.nextUrl.searchParams.get("socialAccountId");

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, message: "workspaceId obrigatório" },
        { status: 400 }
      );
    }

    const accounts = await getConnectedAccounts(workspaceId, network, socialAccountId);

    let totalFollowers = 0;
    let totalMedia = 0;
    const names: string[] = [];

    for (const account of accounts) {
      if (account.network === "instagram") {
        const ig = await loadInstagramInsights(account);
        totalFollowers += toNumber(ig.followers_count, 0);
        totalMedia += toNumber(ig.media_count, 0);
        if (ig.username) names.push(ig.username);
        continue;
      }

      if (account.network === "facebook") {
        const fb = await loadFacebookInsights(account);
        totalFollowers += toNumber(fb.followers_count, 0);
        totalMedia += toNumber(fb.media_count, 0);
        if (fb.username) names.push(fb.username);
      }
    }

    const username =
      socialAccountId && names[0]
        ? names[0]
        : accounts.length > 1
        ? `${accounts.length} contas`
        : names[0] || accounts[0]?.name || "Nenhuma conta conectada";

    // concorrentes monitorados
    const competitorSnap = await adminFirestore
      .collection("competitorAccounts")
      .where("workspaceId", "==", workspaceId)
      .get();

    const competitorsCount = competitorSnap.size;

    // mensagens respondidas
    const supporterInteractionsSnap = await adminFirestore
      .collection("supporterInteractions")
      .where("workspaceId", "==", workspaceId)
      .get();

    const totalInteractions = supporterInteractionsSnap.size;
    const repliedInteractions = supporterInteractionsSnap.docs.filter((doc) =>
      isInteractionReplied(doc.data())
    ).length;

    const repliedRate =
      totalInteractions > 0
        ? Math.round((repliedInteractions / totalInteractions) * 100)
        : 0;

    return NextResponse.json({
      ok: true,
      data: {
        followers_count: totalFollowers,
        media_count: totalMedia,
        username,
        replied_rate: repliedRate,
        replied_count: repliedInteractions,
        interactions_count: totalInteractions,
        competitors_count: competitorsCount,
      },
    });
  } catch (error) {
    console.error("[dashboard/insights API]", error);
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}