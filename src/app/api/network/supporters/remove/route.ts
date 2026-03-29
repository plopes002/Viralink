// src/app/api/network/supporters/remove/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supporterAccountId } = body;

    if (!supporterAccountId) {
      return NextResponse.json(
        { ok: false, error: "supporterAccountId não informado." },
        { status: 400 }
      );
    }

    await adminFirestore
      .collection("campaignAccounts")
      .doc(supporterAccountId)
      .update({
        status: "revoked",
        updatedAt: new Date().toISOString(),
      });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[supporters/remove] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao remover apoiador." },
      { status: 500 }
    );
  }
}