// src/app/api/instagram/insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId obrigatório" },
        { status: 400 }
      );
    }

    const snap = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("network", "==", "instagram")
      .where("status", "==", "connected")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { ok: false, error: "Conta Instagram não encontrada" },
        { status: 404 }
      );
    }

    const account = snap.docs[0].data();

    const instagramId = account.accountId;
    const accessToken = account.accessToken;

    if (!instagramId) {
      return NextResponse.json(
        { ok: false, error: "accountId ausente em socialAccounts" },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "accessToken ausente em socialAccounts" },
        { status: 400 }
      );
    }

    const metaRes = await fetch(
      `https://graph.facebook.com/v20.0/${instagramId}?fields=id,username,followers_count,media_count&access_token=${encodeURIComponent(accessToken)}`,
      { cache: "no-store" }
    );

    const raw = await metaRes.text();

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { ok: false, error: `Meta não retornou JSON: ${raw.slice(0, 300)}` },
        { status: 502 }
      );
    }

    if (!metaRes.ok || data.error) {
      return NextResponse.json(
        {
          ok: false,
          error: data?.error?.message || "Erro ao consultar Meta",
          meta: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (err: any) {
    console.error("[instagram insights] erro:", err);

    return NextResponse.json(
      { ok: false, error: err?.message || "Erro interno na rota insights" },
      { status: 500 }
    );
  }
}