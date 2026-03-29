// src/app/api/competitors/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

function normalizeUsername(value: string) {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, competitorId } = body;

    if (!workspaceId || !competitorId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId e competitorId são obrigatórios." },
        { status: 400 }
      );
    }

    const competitorRef = adminFirestore
      .collection("competitorAccounts")
      .doc(competitorId);

    const competitorSnap = await competitorRef.get();

    if (!competitorSnap.exists) {
      return NextResponse.json(
        { ok: false, error: "Concorrente não encontrado." },
        { status: 404 }
      );
    }

    const competitor = competitorSnap.data() as any;
    const username = normalizeUsername(competitor.username);

    if (!username) {
      return NextResponse.json(
        { ok: false, error: "Concorrente sem username." },
        { status: 400 }
      );
    }

    // pega a conta social principal conectada do workspace
    const socialSnap = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("network", "==", "instagram")
      .where("isPrimary", "==", true)
      .limit(1)
      .get();

    if (socialSnap.empty) {
      return NextResponse.json(
        { ok: false, error: "Conta principal do Instagram não encontrada." },
        { status: 404 }
      );
    }

    const socialDoc = socialSnap.docs[0];
    const social = socialDoc.data() as any;

    const igUserId = social.accountId;
    const accessToken = social.pageAccessToken || social.accessToken;

    if (!igUserId || !accessToken) {
      return NextResponse.json(
        { ok: false, error: "Conta principal sem accountId ou token." },
        { status: 400 }
      );
    }

    const fields = [
      `business_discovery.username(${username}){`,
      [
        "id",
        "username",
        "name",
        "followers_count",
        "follows_count",
        "media_count",
        "profile_picture_url",
        "website",
        "biography",
        "media.limit(12){id,caption,like_count,comments_count,media_type,media_url,permalink,timestamp}"
      ].join(","),
      "}"
    ].join("");

    const url =
      `https://graph.facebook.com/v20.0/${encodeURIComponent(igUserId)}` +
      `?fields=${encodeURIComponent(fields)}` +
      `&access_token=${encodeURIComponent(accessToken)}`;

    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            data?.error?.message ||
            "Erro ao consultar Business Discovery da Meta.",
        },
        { status: 500 }
      );
    }

    const discovery = data?.business_discovery;

    if (!discovery) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Business Discovery não retornou dados. Verifique se o concorrente é profissional e visível pela API.",
        },
        { status: 400 }
      );
    }

    const media = Array.isArray(discovery.media?.data)
      ? discovery.media.data
      : [];

    const avgLikes =
      media.length > 0
        ? Math.round(
            media.reduce((sum: number, item: any) => sum + Number(item.like_count || 0), 0) /
              media.length
          )
        : 0;

    const avgComments =
      media.length > 0
        ? Math.round(
            media.reduce((sum: number, item: any) => sum + Number(item.comments_count || 0), 0) /
              media.length
          )
        : 0;

    const engagementRate =
      discovery.followers_count > 0
        ? Number(
            (
              ((avgLikes + avgComments) / Number(discovery.followers_count || 1)) *
              100
            ).toFixed(2)
          )
        : 0;

    const now = new Date().toISOString();

    await competitorRef.set(
      {
        instagramAccountId: discovery.id || null,
        username: discovery.username || username,
        name: discovery.name || competitor.name || username,
        profilePictureUrl: discovery.profile_picture_url || null,
        biography: discovery.biography || null,
        website: discovery.website || null,
        followers: Number(discovery.followers_count || 0),
        followsCount: Number(discovery.follows_count || 0),
        mediaCount: Number(discovery.media_count || 0),
        avgLikes,
        avgComments,
        engagementRate,
        lastSyncedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    // opcional: histórico para gráficos
    await adminFirestore.collection("socialMetricsHistory").add({
      workspaceId,
      entityType: "competitor",
      entityId: competitorId,
      followers: Number(discovery.followers_count || 0),
      engagementRate,
      avgLikes,
      avgComments,
      createdAt: now,
      source: "business_discovery",
    });

    return NextResponse.json({
      ok: true,
      competitor: {
        id: competitorId,
        username: discovery.username || username,
        name: discovery.name || competitor.name || username,
        followers: Number(discovery.followers_count || 0),
        followsCount: Number(discovery.follows_count || 0),
        mediaCount: Number(discovery.media_count || 0),
        avgLikes,
        avgComments,
        engagementRate,
      },
    });
  } catch (error: any) {
    console.error("[competitors/sync] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao sincronizar concorrente." },
      { status: 500 }
    );
  }
}