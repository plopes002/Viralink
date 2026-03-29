// src/app/api/competitors/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { competitorId } = body;

    if (!competitorId) {
      return NextResponse.json(
        { ok: false, error: "competitorId é obrigatório." },
        { status: 400 }
      );
    }

    const ref = adminFirestore.collection("competitorAccounts").doc(competitorId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { ok: false, error: "Concorrente não encontrado." },
        { status: 404 }
      );
    }

    await ref.delete();

    return NextResponse.json({
      ok: true,
      competitorId,
    });
  } catch (error: any) {
    console.error("[competitors/delete] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao excluir concorrente." },
      { status: 500 }
    );
  }
}