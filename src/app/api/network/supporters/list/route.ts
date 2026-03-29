// src/app/api/network/supporters/list/route.ts
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

    const supporters = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      ok: true,
      supporters,
    });
  } catch (error: any) {
    console.error("[supporters/list] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao listar apoiadores." },
      { status: 500 }
    );
  }
}