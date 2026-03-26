// src/app/api/multi-account/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      token,
      childWorkspaceId,
      acceptedByUserId,
    } = body || {};

    if (!token || !childWorkspaceId || !acceptedByUserId) {
      return NextResponse.json(
        { error: "token, childWorkspaceId e acceptedByUserId são obrigatórios." },
        { status: 400 },
      );
    }

    const inviteSnap = await adminFirestore
      .collection("workspaceInvites")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (inviteSnap.empty) {
      return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
    }

    const inviteDoc = inviteSnap.docs[0];
    const invite = inviteDoc.data() as any;

    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Convite não está pendente." }, { status: 400 });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      await inviteDoc.ref.update({
        status: "expired",
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ error: "Convite expirado." }, { status: 400 });
    }

    const existingLink = await adminFirestore
      .collection("workspaceLinks")
      .where("masterWorkspaceId", "==", invite.masterWorkspaceId)
      .where("childWorkspaceId", "==", childWorkspaceId)
      .limit(1)
      .get();

    if (!existingLink.empty) {
      return NextResponse.json({ error: "Vínculo já existe." }, { status: 400 });
    }

    const now = new Date().toISOString();

    const linkRef = await adminFirestore.collection("workspaceLinks").add({
      masterWorkspaceId: invite.masterWorkspaceId,
      childWorkspaceId,
      status: "active",
      scopes: invite.scopes,
      createdByUserId: invite.createdByUserId,
      acceptedByUserId,
      createdAt: now,
      acceptedAt: now,
      updatedAt: now,
    });

    await inviteDoc.ref.update({
      status: "accepted",
      targetWorkspaceId: childWorkspaceId,
      acceptedByUserId,
      updatedAt: now,
    });

    await adminFirestore.collection("workspaces").doc(invite.masterWorkspaceId).set(
      { kind: "master", updatedAt: now },
      { merge: true },
    );

    await adminFirestore.collection("workspaces").doc(childWorkspaceId).set(
      { kind: "child", updatedAt: now },
      { merge: true },
    );

    return NextResponse.json({
      ok: true,
      linkId: linkRef.id,
    });
  } catch (err) {
    console.error("[multi-account accept] erro:", err);
    return NextResponse.json(
      { error: "Erro ao aceitar convite." },
      { status: 500 },
    );
  }
}
