// src/app/api/instagram/insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, message: "workspaceId obrigatório" },
        { status: 400 }
      );
    }

    const snap = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("network", "==", "instagram")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { ok: false, message: "Conta não encontrada" },
        { status: 404 }
      );
    }

    const account = snap.docs[0].data();
    const instagramId = account.accountId;
    const accessToken = account.accessToken;

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${instagramId}?fields=followers_count,media_count,username&access_token=${accessToken}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "Failed to fetch from Meta API");
    }

    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD

    const historyRef = adminFirestore
      .collection("instagramInsightsHistory")
      .doc(`${workspaceId}_${instagramId}_${dateKey}`);

    await historyRef.set(
      {
        workspaceId,
        accountId: instagramId,
        username: data.username || account.username || "",
        followersCount: data.followers_count || 0,
        mediaCount: data.media_count || 0,
        dateKey,
        capturedAt: now.toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("[instagram/insights API]", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
