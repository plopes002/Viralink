// src/app/api/debug/test-new-follower/route.ts
import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { runAutomationsForEvent } from "@/lib/automationEngine";
import type { InternalSocialEvent } from "@/types/internalSocialEvent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      workspaceId,
      socialAccountId,
      username = "usuario_teste",
      name = "Seguidor Teste",
      externalId = "ig_user_123456",
    } = body || {};

    if (!workspaceId || !socialAccountId) {
      return NextResponse.json(
        {
          error:
            "Informe workspaceId e socialAccountId no corpo da requisição.",
          exemploBody: {
            workspaceId: "workspace_123",
            socialAccountId: "ID_DOC_SOCIAL_ACCOUNT",
            username: "julia_fit",
            name: "Júlia",
            externalId: "1784...",
          },
        },
        { status: 400 },
      );
    }

    // só pra garantir que a conta existe
    const accSnap = await adminFirestore
      .collection("socialAccounts")
      .doc(socialAccountId)
      .get();

    if (!accSnap.exists) {
      return NextResponse.json(
        {
          error:
            "socialAccount não encontrada. Verifique o socialAccountId enviado.",
        },
        { status: 404 },
      );
    }

    const event: InternalSocialEvent = {
      workspaceId,
      socialAccountId,
      network: "instagram",
      type: "new_follower",
      text: "",
      fromUser: {
        externalId,
        name,
        username,
      },
      raw: {
        source: "debug-test-new-follower",
        note: "Evento simulado via rota de teste.",
      },
      receivedAt: new Date().toISOString(),
    };

    // log opcional
    await adminFirestore.collection("socialEvents").add(event);

    // roda a engine de automações
    await runAutomationsForEvent(event);

    return NextResponse.json({
      ok: true,
      message:
        "Evento de novo seguidor simulado. Veja os logs do console e da coleção automationLogs.",
      event,
    });
  } catch (err) {
    console.error("[test-new-follower] erro:", err);
    return NextResponse.json(
      { error: "Erro interno ao simular evento." },
      { status: 500 },
    );
  }
}
