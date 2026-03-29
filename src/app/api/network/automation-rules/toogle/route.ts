// src/app/api/network/automation-rules/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ruleId, active } = body;

    if (!ruleId) {
      return NextResponse.json(
        { ok: false, error: "ruleId é obrigatório." },
        { status: 400 }
      );
    }

    if (typeof active !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "active deve ser boolean." },
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

    await ref.set(
      {
        active,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      ruleId,
      active,
    });
  } catch (error: any) {
    console.error("[automation-rules/toggle] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao atualizar regra." },
      { status: 500 }
    );
  }
}