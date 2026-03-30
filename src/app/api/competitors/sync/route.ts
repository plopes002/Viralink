// src/app/api/competitors/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import {
  politicalKeywords,
  politicalPositiveWords,
  politicalNegativeWords,
} from "@/lib/politicalKeywords";

function normalizeUsername(value: string) {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

function inferSentimentFromCaption(text?: string) {
  const value = String(text || "").toLowerCase();

  const isPolitical = politicalKeywords.some((w) =>
    value.includes(w)
  );

  if (isPolitical) {
    const pos = politicalPositiveWords.filter((w) =>
      value.includes(w)
    ).length;

    const neg = politicalNegativeWords.filter((w) =>
      value.includes(w)
    ).length;

    if (pos > neg) return "political_positive";
    if (neg > pos) return "political_negative";
    return "political_neutral";
  }

  // fallback comercial
  const positiveWords = ["promo", "oferta", "desconto"];
  const negativeWords = ["erro", "problema"];

  const pos = positiveWords.filter((w) => value.includes(w)).length;
  const neg = negativeWords.filter((w) => value.includes(w)).length;

  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

function isPolitical(text: string) {
    const value = text.toLowerCase();
    return politicalKeywords.some((w) => value.includes(w));
  }
  
  function getPoliticalSentiment(text: string) {
    const value = text.toLowerCase();
  
    const pos = politicalPositiveWords.filter((w) => value.includes(w)).length;
    const neg = politicalNegativeWords.filter((w) => value.includes(w)).length;
  
    if (pos > neg) return "positive";
    if (neg > pos) return "negative";
    return "neutral";
  }

function inferInteractionType(mediaType?: string) {
  const value = String(mediaType || "").toUpperCase();

  if (value === "VIDEO" || value === "REELS") return "video_engagement";
  if (value === "CAROUSEL_ALBUM") return "carousel_engagement";
  return "post_engagement";
}

function buildLeadScore(params: {
  likeCount: number;
  commentsCount: number;
  followers: number;
  caption?: string;
}) {
  const { likeCount, commentsCount, followers, caption } = params;

  let score = 0;

  if (followers > 0) {
    const engagementRate = ((likeCount + commentsCount) / followers) * 100;

    if (engagementRate >= 5) score += 40;
    else if (engagementRate >= 3) score += 25;
    else if (engagementRate >= 1) score += 10;
  }

  if (commentsCount >= 20) score += 25;
  else if (commentsCount >= 10) score += 15;
  else if (commentsCount >= 3) score += 8;

  if (likeCount >= 300) score += 20;
  else if (likeCount >= 100) score += 12;
  else if (likeCount >= 30) score += 6;

  const sentiment = inferSentimentFromCaption(caption);
  if (sentiment === "positive") score += 10;

  return Math.min(score, 100);
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
        "media.limit(12){id,caption,like_count,comments_count,media_type,permalink,timestamp}"
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
            media.reduce(
              (sum: number, item: any) => sum + Number(item.like_count || 0),
              0
            ) / media.length
          )
        : 0;

    const avgComments =
      media.length > 0
        ? Math.round(
            media.reduce(
              (sum: number, item: any) => sum + Number(item.comments_count || 0),
              0
            ) / media.length
          )
        : 0;

    const engagementRate =
      Number(discovery.followers_count || 0) > 0
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

    let mediaUpserts = 0;
    let leadsUpserts = 0;

    for (const item of media) {
      const mediaId = String(item?.id || "");
      if (!mediaId) continue;

      const mediaRef = adminFirestore
        .collection("competitorMedia")
        .doc(`${workspaceId}_${competitorId}_${mediaId}`);

      await mediaRef.set(
        {
          workspaceId,
          competitorId,
          competitorUsername: discovery.username || username,
          competitorName: discovery.name || competitor.name || username,
          instagramAccountId: discovery.id || null,
          mediaId,
          caption: item?.caption || "",
          likeCount: Number(item?.like_count || 0),
          commentsCount: Number(item?.comments_count || 0),
          mediaType: item?.media_type || null,
          permalink: item?.permalink || null,
          postedAt: item?.timestamp || null,
          updatedAt: now,
          createdAt: now,
        },
        { merge: true }
      );

      mediaUpserts += 1;

      const inferredSentiment = inferSentimentFromCaption(item?.caption || "");
      const leadScore = buildLeadScore({
        likeCount: Number(item?.like_count || 0),
        commentsCount: Number(item?.comments_count || 0),
        followers: Number(discovery.followers_count || 0),
        caption: item?.caption || "",
      });

      const leadRef = adminFirestore
        .collection("competitorLeads")
        .doc(`${workspaceId}_${competitorId}_${mediaId}`);

      await leadRef.set(
        {
          workspaceId,
          competitorId,
          source: "competitor_media_analysis",
          sourceMediaId: mediaId,
          competitorUsername: discovery.username || username,
          competitorName: discovery.name || competitor.name || username,
          username: discovery.username || username,
          displayName: discovery.name || competitor.name || username,
          profilePictureUrl: discovery.profile_picture_url || null,
          interactionType: inferInteractionType(item?.media_type),
          sentiment: inferredSentiment,
          score: leadScore,
          note: item?.caption || "",
          isFollower: false,
          hasInteracted: Number(item?.comments_count || 0) > 0 || Number(item?.like_count || 0) > 0,
          capturedFrom: "competitor_post",
          status: "new",
          metrics: {
            likeCount: Number(item?.like_count || 0),
            commentsCount: Number(item?.comments_count || 0),
          },
          media: {
            mediaId,
            mediaType: item?.media_type || null,
            permalink: item?.permalink || null,
            caption: item?.caption || "",
            postedAt: item?.timestamp || null,
          },
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      leadsUpserts += 1;
    }

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
      stats: {
        mediaUpserts,
        leadsUpserts,
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
