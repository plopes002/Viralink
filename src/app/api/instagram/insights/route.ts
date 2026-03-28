// src/app/api/instagram/insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ ok: false, message: "workspaceId obrigatório" }, { status: 400 });
    }

    // 🔎 Buscar conta conectada
    const snap = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("network", "==", "instagram")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ ok: false, message: "Conta Instagram não encontrada para este workspace." }, { status: 404 });
    }

    const account = snap.docs[0].data();

    const accessToken = account.accessToken; // Assumes the user access token is stored here
    const instagramId = account.accountId;

    if (!accessToken || !instagramId) {
        return NextResponse.json({ ok: false, message: "Access token ou ID da conta do Instagram ausentes." }, { status: 400 });
    }

    // 🔥 Buscar dados do Instagram
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${instagramId}?fields=followers_count,media_count,username&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Instagram API Error:", errorData);
      return NextResponse.json({ ok: false, message: "Erro ao buscar dados do Instagram.", error: errorData }, { status: response.status });
    }

    const data = await response.json();

    // Update followers count in Firestore asynchronously
    adminFirestore.collection("socialAccounts").doc(snap.docs[0].id).update({
        followers: data.followers_count || account.followers || 0,
        updatedAt: new Date().toISOString(),
    }).catch(err => console.error("Failed to update follower count:", err));


    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("[insights API] ", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido no servidor.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
