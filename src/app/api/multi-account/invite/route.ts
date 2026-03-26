// src/app/api/multi-account/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      masterWorkspaceId,
      invitedEmail,
      targetWorkspaceId = null,
      createdByUserId,
      scopes,
    } = body || {};

    if (!masterWorkspaceId || !createdByUserId) {
      return NextResponse.json(
        { error: "masterWorkspaceId e createdByUserId são obrigatórios." },
        { status: 400 },
      );
    }

    const token = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const ref = await adminFirestore.collection("workspaceInvites").add({
      masterWorkspaceId,
      invitedEmail: invitedEmail || null,
      targetWorkspaceId,
      token,
      scopes: {
        analytics: !!scopes?.analytics,
        crm: !!scopes?.crm,
        campaigns: !!scopes?.campaigns,
        competitorLeads: !!scopes?.competitorLeads,
        socialAccounts: !!scopes?.socialAccounts,
      },
      status: "pending",
      createdByUserId,
      acceptedByUserId: null,
      expiresAt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return NextResponse.json({
      ok: true,
      inviteId: ref.id,
      token,
      expiresAt,
    });
  } catch (err) {
    console.error("[multi-account invite] erro:", err);
    return NextResponse.json(
      { error: "Erro ao criar convite." },
      { status: 500 },
    );
  }
}
