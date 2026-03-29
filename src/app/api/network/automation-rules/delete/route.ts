// src/app/api/network/automation-rules/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ruleId } = body;

    if (!ruleId) {
      return NextResponse.json(
        { ok: false, error: "ruleId é obrigatório." },
        { status: 400 }
      );
    }

    const ref = adminFirestore
      .collection("interactionAutomationRules")
      .doc(ruleId);

    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { ok: false, error: "Regra não encontrada." },
        { status: 404 }
      );
    }

    await ref.delete();

    return NextResponse.json({
      ok: true,
      ruleId,
    });
  } catch (error: any) {
    console.error("[automation-rules/delete] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao excluir regra." },
      { status: 500 }
    );
  }
} 