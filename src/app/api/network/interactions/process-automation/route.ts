// src/app/api/network/interactions/process-automation/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { processInteractionAutomation } from "@/lib/interactionAutomationEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { interactionId } = body;

    // ✅ Validação básica
    if (!interactionId) {
      return NextResponse.json(
        { ok: false, error: "interactionId obrigatório." },
        { status: 400 }
      );
    }

    // ✅ Buscar interação no Firestore
    const interactionRef = adminFirestore
      .collection("supporterInteractions")
      .doc(interactionId);

    const interactionSnap = await interactionRef.get();

    if (!interactionSnap.exists) {
      return NextResponse.json(
        { ok: false, error: "Interação não encontrada." },
        { status: 404 }
      );
    }

    const interaction = interactionSnap.data() as any;

    // 🔴 PROTEÇÃO CRÍTICA (esse era o seu erro)
    if (!interaction.workspaceId) {
      return NextResponse.json(
        { ok: false, error: "interaction sem workspaceId" },
        { status: 400 }
      );
    }

    if (!interaction.primaryAccountId) {
      return NextResponse.json(
        { ok: false, error: "interaction sem primaryAccountId" },
        { status: 400 }
      );
    }

    if (!interaction.commenterText) {
      return NextResponse.json(
        { ok: false, error: "interaction sem texto para analisar" },
        { status: 400 }
      );
    }

    // 🧠 LOG pra debug (pode deixar por enquanto)
    console.log("PROCESSANDO INTERACTION:", {
      id: interactionId,
      workspaceId: interaction.workspaceId,
      primaryAccountId: interaction.primaryAccountId,
      text: interaction.commenterText,
    });

    // 🚀 Processar automação
    const result = await processInteractionAutomation(interactionId);

    return NextResponse.json({
      ok: true,
      ...result,
    });

  } catch (error: any) {
    console.error("[interactions/process-automation] erro:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao processar automação.",
      },
      { status: 500 }
    );
  }
}