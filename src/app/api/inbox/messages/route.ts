// src/app/api/inbox/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const threadId = req.nextUrl.searchParams.get("threadId");

    if (!workspaceId || !threadId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId e threadId são obrigatórios" },
        { status: 400 }
      );
    }

    const threadRef = adminFirestore.collection("inboxThreads").doc(threadId);
    const threadSnap = await threadRef.get();

    if (!threadSnap.exists) {
      return NextResponse.json(
        { ok: false, error: "Thread não encontrada" },
        { status: 404 }
      );
    }

    const thread = threadSnap.data();

    if (thread?.workspaceId !== workspaceId) {
      return NextResponse.json(
        { ok: false, error: "Acesso negado à thread" },
        { status: 403 }
      );
    }

    const snap = await adminFirestore
      .collection("inboxMessages")
      .where("workspaceId", "==", workspaceId)
      .where("threadId", "==", threadId)
      .orderBy("sentAt", "asc")
      .limit(300)
      .get();

    const messages = snap.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        sentAt: data.sentAt?.toDate?.()?.toISOString?.() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
        deletedAt: data.deletedAt?.toDate?.()?.toISOString?.() || null,
      };
    });

    return NextResponse.json({
      ok: true,
      messages,
    });
  } catch (error: any) {
    console.error("[api/inbox/messages] error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao listar mensagens" },
      { status: 500 }
    );
  }
}
