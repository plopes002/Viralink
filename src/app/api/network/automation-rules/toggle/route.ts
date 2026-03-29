// src/app/api/network/automation-rules/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ruleId, active } = body;

    if (!ruleId || typeof active !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "ruleId e active são obrigatórios." },
        { status: 400 }
      );
    }

    await adminFirestore.collection("interactionAutomationRules").doc(ruleId).update({
      active,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[automation-rules/toggle] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao atualizar regra." },
      { status: 500 }
    );
  }
}