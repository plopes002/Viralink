// src/app/api/network/automation-rules/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ruleId,
      name,
      keywords,
      actions,
      replyTemplatePublic,
      replyTemplatePrivate,
      priority,
    } = body;

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

    await ref.set(
      {
        ...(name !== undefined && { name }),
        ...(keywords !== undefined && { keywords }),
        ...(actions !== undefined && { actions }),
        ...(replyTemplatePublic !== undefined && { replyTemplatePublic }),
        ...(replyTemplatePrivate !== undefined && { replyTemplatePrivate }),
        ...(priority !== undefined && { priority }),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      ruleId,
    });
  } catch (error: any) {
    console.error("[automation-rules/update] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao atualizar regra." },
      { status: 500 }
    );
  }
}