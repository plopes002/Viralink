// src/app/api/network/automation-rules/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      workspaceId,
      primaryAccountId,
      name,

      // formato antigo
      keywords,
      triggerType,
      replyTemplatePublic,
      replyTemplatePrivate,
      delaySeconds,

      // formato novo
      matchType,
      publicReplyTemplate,
      privateReplyTemplate,
      priority,
      active,

      // comum
      actions,
    } = body;

    if (!workspaceId || !primaryAccountId || !name) {
      return NextResponse.json(
        { ok: false, error: "Dados obrigatórios faltando." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const normalizedActions = {
      markAsRead: !!actions?.markAsRead,
      publicReply: !!actions?.publicReply,
      privateReply: !!actions?.privateReply,
      convertToLead: !!actions?.convertToLead,
    };

    const ref = await adminFirestore.collection("interactionAutomationRules").add({
      workspaceId,
      primaryAccountId,
      name,

      keywords: Array.isArray(keywords) ? keywords : [],

      // compatibilidade: motor pode ler matchType ou triggerType
      triggerType: triggerType || matchType || "contains",
      matchType: matchType || triggerType || "contains",

      actions: normalizedActions,

      // salva os dois nomes para evitar quebra
      replyTemplatePublic:
        replyTemplatePublic || publicReplyTemplate || null,
      replyTemplatePrivate:
        replyTemplatePrivate || privateReplyTemplate || null,

      publicReplyTemplate:
        publicReplyTemplate || replyTemplatePublic || null,
      privateReplyTemplate:
        privateReplyTemplate || replyTemplatePrivate || null,

      delaySeconds: Number(delaySeconds || 0),
      priority: Number(priority || 100),
      active: active !== false,

      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      ok: true,
      ruleId: ref.id,
    });
  } catch (error: any) {
    console.error("[automation-rules/create] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao criar regra." },
      { status: 500 }
    );
  }
}