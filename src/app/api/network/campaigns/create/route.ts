// src/app/api/network/campaigns/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      workspaceId,
      primaryAccountId,
      title,
      description,
      objective,
      createdByUserId,
    } = body;

    if (!workspaceId || !primaryAccountId || !title || !objective) {
      return NextResponse.json(
        { ok: false, error: "Dados obrigatórios não informados." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const ref = await adminFirestore.collection("boostCampaigns").add({
      workspaceId,
      primaryAccountId,
      title,
      description: description || "",
      objective,
      status: "active",
      createdByUserId: createdByUserId || null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      ok: true,
      campaignId: ref.id,
    });
  } catch (error: any) {
    console.error("[campaigns/create] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao criar campanha." },
      { status: 500 }
    );
  }
}