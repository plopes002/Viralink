// src/app/api/network/supporters/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const primaryAccountId = req.nextUrl.searchParams.get("primaryAccountId");

    if (!workspaceId || !primaryAccountId) {
      return NextResponse.json(
        { ok: false, error: "Parâmetros obrigatórios não informados." },
        { status: 400 }
      );
    }

    const snap = await adminFirestore
      .collection("campaignAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("linkedToAccountId", "==", primaryAccountId)
      .get();

    const supporters = snap.docs.map((doc) => doc.data());

    const total = supporters.length;
    const active = supporters.filter((s) => s.status === "connected").length;
    const revoked = supporters.filter((s) => s.status === "revoked").length;
    const leadEnabled = supporters.filter(
      (s) => s.permissions?.allowLeadCapture
    ).length;

    return NextResponse.json({
      ok: true,
      stats: {
        total,
        active,
        revoked,
        leadEnabled,
      },
    });
  } catch (error: any) {
    console.error("[supporters/stats] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao carregar estatísticas." },
      { status: 500 }
    );
  }
}