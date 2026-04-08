// src/app/api/inbox/thread-settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateThreadSettings } from "@/lib/inbox";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workspaceId = body?.workspaceId;
    const threadId = body?.threadId;
    const automationEnabled = body?.automationEnabled;
    const status = body?.status;

    if (!workspaceId || !threadId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId e threadId são obrigatórios" },
        { status: 400 }
      );
    }

    await updateThreadSettings({
      workspaceId,
      threadId,
      automationEnabled:
        typeof automationEnabled === "boolean" ? automationEnabled : undefined,
      status,
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error: any) {
    console.error("[api/inbox/thread-settings] error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao atualizar thread" },
      { status: 500 }
    );
  }
}
