// src/app/api/inbox/mark-read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workspaceId = String(body?.workspaceId || "").trim();
    const threadId = String(body?.threadId || "").trim();

    if (!workspaceId || !threadId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId e threadId são obrigatórios" },
        { status: 400 }
      );
    }

    const ref = adminFirestore.collection("inboxThreads").doc(threadId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { ok: false, error: "Thread não encontrada" },
        { status: 404 }
      );
    }

    const data = snap.data();

    if (data?.workspaceId !== workspaceId) {
      return NextResponse.json(
        { ok: false, error: "Acesso negado à thread" },
        { status: 403 }
      );
    }

    await ref.update({
      unreadCount: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[api/inbox/mark-read] error:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao marcar como lida" },
      { status: 500 }
    );
  }
}