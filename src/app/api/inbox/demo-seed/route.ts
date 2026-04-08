// src/app/api/inbox/demo-seed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workspaceId = body?.workspaceId;
    const socialAccountId = body?.socialAccountId;

    if (!workspaceId || !socialAccountId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId e socialAccountId são obrigatórios" },
        { status: 400 }
      );
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    const threadRef = await adminFirestore.collection("inboxThreads").add({
      workspaceId,
      socialAccountId,
      network: "instagram",
      platformThreadId: `demo-thread-${Date.now()}`,
      customerId: `demo-user-${Date.now()}`,
      customerUsername: "cliente.demo",
      customerName: "Cliente Demo",
      customerProfilePic: "",
      lastMessageText: "Olá, gostaria de saber mais informações.",
      lastMessageAt: now,
      lastMessageDirection: "inbound",
      unreadCount: 1,
      status: "open",
      automationEnabled: true,
      createdAt: now,
      updatedAt: now,
    });

    await adminFirestore.collection("inboxMessages").add({
      workspaceId,
      threadId: threadRef.id,
      socialAccountId,
      network: "instagram",
      platformMessageId: `demo-msg-${Date.now()}`,
      direction: "inbound",
      senderType: "customer",
      text: "Olá, gostaria de saber mais informações.",
      sentAt: now,
      deliveryStatus: "received",
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdAt: now,
      raw: { demo: true },
    });

    return NextResponse.json({
      ok: true,
      threadId: threadRef.id,
    });
  } catch (error: any) {
    console.error("[api/inbox/demo-seed] error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao criar seed demo" },
      { status: 500 }
    );
  }
}
