// src/app/api/network/supporter-invites/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { token, ownerUserId, name, username, network } = body;

    if (!token || !ownerUserId || !name) {
      return NextResponse.json(
        { ok: false, error: "Dados obrigatórios não informados." },
        { status: 400 }
      );
    }

    const inviteSnap = await adminFirestore
      .collection("supporterInvites")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (inviteSnap.empty) {
      return NextResponse.json(
        { ok: false, error: "Convite não encontrado." },
        { status: 404 }
      );
    }

    const inviteDoc = inviteSnap.docs[0];
    const invite = inviteDoc.data();

    if (invite.status !== "pending") {
      return NextResponse.json(
        { ok: false, error: "Convite inválido." },
        { status: 400 }
      );
    }

    if (invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, error: "Convite expirado." },
        { status: 400 }
      );
    }

    const existingSupporter = await adminFirestore
      .collection("campaignAccounts")
      .where("workspaceId", "==", invite.workspaceId)
      .where("role", "==", "supporter")
      .where("ownerUserId", "==", ownerUserId)
      .where("linkedToAccountId", "==", invite.primaryAccountId)
      .limit(1)
      .get();

    if (!existingSupporter.empty) {
      return NextResponse.json(
        { ok: false, error: "Este apoiador já está vinculado." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const supporterRef = await adminFirestore.collection("campaignAccounts").add({
      workspaceId: invite.workspaceId,
      role: "supporter",
      linkedToAccountId: invite.primaryAccountId,
      socialAccountId: null,
      accountId: null,
      name,
      username: username || "",
      network: network || "instagram",
      ownerUserId,
      permissions: {
        allowContentBoost: true,
        allowLeadCapture: false,
        allowFollowerCampaigns: true,
      },
      status: "connected",
      createdAt: now,
      updatedAt: now,
    });

    await inviteDoc.ref.update({
      status: "accepted",
      acceptedAt: now,
    });

    return NextResponse.json({
      ok: true,
      supporterAccountId: supporterRef.id,
    });
  } catch (error: any) {
    console.error("[supporter-invites/accept] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao aceitar convite." },
      { status: 500 }
    );
  }
}