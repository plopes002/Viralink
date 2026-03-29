// src/app/api/network/supporter-invites/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { workspaceId, primaryAccountId, invitedByUserId, supporterName } =
      body;

    if (!workspaceId || !primaryAccountId || !invitedByUserId) {
      return NextResponse.json(
        { ok: false, error: "Dados obrigatórios não informados." },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(20).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const ref = await adminFirestore.collection("supporterInvites").add({
      workspaceId,
      primaryAccountId,
      invitedByUserId,
      supporterName: supporterName || null,
      supporterEmail: null,
      token,
      status: "pending",
      expiresAt: expiresAt.toISOString(),
      acceptedAt: null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      inviteId: ref.id,
      token,
      link: `/supporters/connect?token=${token}`,
    });
  } catch (error: any) {
    console.error("[supporter-invites/create] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao criar convite." },
      { status: 500 }
    );
  }
}