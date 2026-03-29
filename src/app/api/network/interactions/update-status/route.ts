// src/app/api/network/interactions/update-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { interactionId, status } = body;

    if (!interactionId || !status) {
      return NextResponse.json(
        { ok: false, error: "interactionId e status são obrigatórios." },
        { status: 400 }
      );
    }

    await adminFirestore.collection("supporterInteractions").doc(interactionId).update({
      status,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[interactions/update-status] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao atualizar status." },
      { status: 500 }
    );
  }
}