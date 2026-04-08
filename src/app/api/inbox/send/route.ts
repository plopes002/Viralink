// src/app/api/inbox/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import {
  assertThreadBelongsToWorkspace,
  createOutboundInboxMessage,
  threadHasInboundMessage,
  updateThreadAfterOutbound,
} from "@/lib/inbox";

async function dispatchInstagramDirectReply(params: {
  socialAccount: any;
  thread: any;
  text: string;
}) {
  const accessToken =
    params.socialAccount?.pageAccessToken ||
    params.socialAccount?.accessToken ||
    null;

  if (!accessToken) {
    return {
      ok: false,
      simulated: true,
      error: "Conta conectada sem token válido para envio",
    };
  }

  const recipientId =
    params.thread?.customerId ||
    params.thread?.instagramScopedUserId ||
    null;

  if (!recipientId) {
    return {
      ok: false,
      simulated: true,
      error: "Thread sem recipientId para envio",
    };
  }

  try {
    const endpoint = `https://graph.facebook.com/v23.0/${params.socialAccount.accountId}/messages`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: params.text },
        messaging_type: "RESPONSE",
        access_token: accessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        simulated: true,
        error: data?.error?.message || "Falha ao enviar pela Graph API",
        raw: data,
      };
    }

    return {
      ok: true,
      simulated: false,
      platformMessageId: data?.message_id || null,
      raw: data,
    };
  } catch (error: any) {
    return {
      ok: false,
      simulated: true,
      error: error?.message || "Erro inesperado ao enviar pela Graph API",
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workspaceId = body?.workspaceId;
    const threadId = body?.threadId;
    const text = String(body?.text || "").trim();

    if (!workspaceId || !threadId || !text) {
      return NextResponse.json(
        { ok: false, error: "workspaceId, threadId e text são obrigatórios" },
        { status: 400 }
      );
    }

    const thread = await assertThreadBelongsToWorkspace(threadId, workspaceId);

    const hasInbound = await threadHasInboundMessage(workspaceId, threadId);

    if (!hasInbound) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Esta conversa não pode ser iniciada pela plataforma. Só é permitido responder a interações já existentes.",
        },
        { status: 400 }
      );
    }

    const socialAccountSnap = await adminFirestore
      .collection("socialAccounts")
      .doc(thread.socialAccountId)
      .get();

    if (!socialAccountSnap.exists) {
      return NextResponse.json(
        { ok: false, error: "Conta social não encontrada" },
        { status: 404 }
      );
    }

    const socialAccount = {
      id: socialAccountSnap.id,
      ...socialAccountSnap.data(),
    };

    if (socialAccount.workspaceId !== workspaceId) {
      return NextResponse.json(
        { ok: false, error: "Conta social não pertence ao workspace informado" },
        { status: 403 }
      );
    }

    const dispatchResult = await dispatchInstagramDirectReply({
      socialAccount,
      thread,
      text,
    });

    const deliveryStatus = dispatchResult.ok ? "sent" : "queued_manual_review";

    const messageId = await createOutboundInboxMessage({
      workspaceId,
      threadId,
      socialAccountId: thread.socialAccountId,
      text,
      senderType: "agent",
      platformMessageId: dispatchResult.ok ? dispatchResult.platformMessageId : null,
      deliveryStatus,
      raw: dispatchResult,
    });

    await updateThreadAfterOutbound({
      threadId,
      text,
    });

    return NextResponse.json({
      ok: true,
      messageId,
      deliveryStatus,
      simulated: !!dispatchResult.simulated,
      warning: dispatchResult.ok
        ? null
        : dispatchResult.error ||
          "Mensagem salva no sistema, mas o envio externo não foi confirmado.",
    });
  } catch (error: any) {
    console.error("[api/inbox/send] error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao enviar mensagem" },
      { status: 500 }
    );
  }
}
