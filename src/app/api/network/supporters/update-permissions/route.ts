// src/app/api/network/supporters/update-permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { supporterAccountId, permissions } = body;

    if (!supporterAccountId || !permissions) {
      return NextResponse.json(
        { ok: false, error: "Dados obrigatórios não informados." },
        { status: 400 }
      );
    }

    await adminFirestore
      .collection("campaignAccounts")
      .doc(supporterAccountId)
      .update({
        permissions: {
          allowContentBoost: !!permissions.allowContentBoost,
          allowLeadCapture: !!permissions.allowLeadCapture,
          allowFollowerCampaigns: !!permissions.allowFollowerCampaigns,
        },
        updatedAt: new Date().toISOString(),
      });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[supporters/update-permissions] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao atualizar permissões." },
      { status: 500 }
    );
  }
}