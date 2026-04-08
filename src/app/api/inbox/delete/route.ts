// src/app/api/inbox/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { softDeleteInboxMessage, assertThreadBelongsToWorkspace } from "@/lib/inbox";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workspaceId = body?.workspaceId;
    const threadId = body?.threadId;
    const messageId = body?.messageId;

    if (!workspaceId || !threadId || !messageId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId, threadId e messageId são obrigatórios" },
        { status: 400 }
      );
    }

    await assertThreadBelongsToWorkspace(threadId, workspaceId);

    await softDeleteInboxMessage({
      workspaceId,
      threadId,
      messageId,
      deletedBy: "agent",
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error: any) {
    console.error("[api/inbox/delete] error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao excluir mensagem" },
      { status: 500 }
    );
  }
}
