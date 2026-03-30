// src/app/api/dashboard/competitors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function resolveCompetitorScore(data: any) {
  return (
    toNumber(data?.engagementIndex, NaN) ||
    toNumber(data?.engagementScore, NaN) ||
    toNumber(data?.score, NaN) ||
    toNumber(data?.avgEngagement, NaN) ||
    0
  );
}

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, message: "workspaceId obrigatório" },
        { status: 400 }
      );
    }

    const competitorSnap = await adminFirestore
      .collection("competitorAccounts")
      .where("workspaceId", "==", workspaceId)
      .get();

    const competitors = competitorSnap.docs
      .map((doc) => {
        const data = doc.data() as any;

        return {
          id: doc.id,
          name: data.name || data.username || "Concorrente",
          score: resolveCompetitorScore(data),
        };
      })
      .sort((a, b) => b.score - a.score);

    // score "Você"
    const ownSocialSnap = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("status", "==", "connected")
      .get();

    const ownScoreBase = ownSocialSnap.size > 0 ? 1 : 0;
    const ownScore =
      Math.max(
        ...competitors.map((c) => c.score),
        0
      ) + (ownScoreBase ? 5 : 0);

    return NextResponse.json({
      ok: true,
      data: {
        leader: ownScore >= (competitors[0]?.score || 0),
        ownScore,
        competitors: competitors.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("[dashboard/competitors API]", error);
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}