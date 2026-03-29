// src/app/api/network/interactions/create-fake/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { processInteractionAutomation } from "@/lib/interactionAutomationEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      workspaceId,
      primaryAccountId,
      sourceCampaignAccountId,
      commenterUsername,
      commenterText,
      sourceRole,
      sourceName,
      sourceUsername,
    } = body;

    if (!workspaceId || !primaryAccountId || !sourceCampaignAccountId) {
      return NextResponse.json(
        {
          ok: false,
          error: "workspaceId, primaryAccountId e sourceCampaignAccountId são obrigatórios.",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const ref = await adminFirestore.collection("supporterInteractions").add({
      workspaceId,
      primaryAccountId,
      sourceCampaignAccountId,
      sourceRole: sourceRole || "supporter",
      sourceName: sourceName || "Conta apoiadora",
      sourceUsername: sourceUsername || "",
      network: "instagram",
      interactionType: "comment",
      externalCommentId: `fake_comment_${Date.now()}`,
      externalMediaId: `fake_media_${Date.now()}`,
      mediaCaption: "Comentário de teste",
      commenterId: `fake_user_${Date.now()}`,
      commenterUsername: commenterUsername || "usuario_teste",
      commenterText: commenterText || "quero saber mais",
      status: "new",
      assignedToUserId: null,
      publicReplyText: null,
      privateReplyText: null,
      createdAt: now,
      updatedAt: now,
    });

    const createdDoc = await ref.get();
    const interaction = {
      id: ref.id,
      ...createdDoc.data(),
    };

    await processInteractionAutomation(interaction);

    return NextResponse.json({
      ok: true,
      interactionId: ref.id,
    });
  } catch (error: any) {
    console.error("[interactions/create-fake] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao criar interação fake." },
      { status: 500 }
    );
  }
}