// src/app/api/network/campaigns/list/route.ts
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
      .collection("boostCampaigns")
      .where("workspaceId", "==", workspaceId)
      .where("primaryAccountId", "==", primaryAccountId)
      .get();

    const campaigns = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    campaigns.sort((a: any, b: any) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );

    return NextResponse.json({
      ok: true,
      campaigns,
    });
  } catch (error: any) {
    console.error("[campaigns/list] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao listar campanhas." },
      { status: 500 }
    );
  }
}