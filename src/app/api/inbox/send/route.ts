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
  const pageAccessToken =
    params.socialAccount?.pageAccessToken ||
    params.socialAccount?.accessToken ||
    null;

  const pageId =
    params.socialAccount?.facebookPageId ||
    params.socialAccount?.pageId ||
    null;

  const recipientId =
    params.thread?.customerId ||
    params.thread?.instagramScopedUserId ||
    null;

  if (!pageAccessToken) {
    return {
      ok: false,
      simulated: true,
      error: "Conta conectada sem pageAccessToken/accessToken válido",
      debug: {
        hasPageAccessToken: false,
        hasPageId: !!pageId,
        hasRecipientId: !!recipientId,
      },
    };
  }

  if (!pageId) {
    return {
      ok: false,
      simulated: true,
      error: "Conta conectada sem facebookPageId/pageId para envio",
      debug: {
        hasPageAccessToken: true,
        hasPageId: false,
        hasRecipientId: !!recipientId,
      },
    };
  }

  if (!recipientId) {
    return {
      ok: false,
      simulated: true,
      error: "Thread sem customerId/instagramScopedUserId para envio",
      debug: {
        hasPageAccessToken: true,
        hasPageId: true,
        hasRecipientId: false,
      },
    };
  }

  const endpoint = `https://graph.facebook.com/v23.0/${pageId}/messages`;

  const payload = {
    recipient: { id: recipientId },
    messaging_type: "RESPONSE",
    message: { text: params.text },
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        access_token: pageAccessToken,
      }),
    });

    const data = await response.json();

    console.log("[IG SEND] endpoint:", endpoint);
    console.log("[IG SEND] pageId:", pageId);
    console.log("[IG SEND] recipientId:", recipientId);
    console.log(
      "[IG SEND] token prefix:",
      typeof pageAccessToken === "string" ? pageAccessToken.slice(0, 12) : null
    );
    console.log("[IG SEND] payload:", JSON.stringify(payload));
    console.log("[IG SEND] status:", response.status);
    console.log("[IG SEND] response:", JSON.stringify(data));

    if (!response.ok) {
      return {
        ok: false,
        simulated: true,
        error: data?.error?.message || "Falha ao enviar pela Graph API",
        graphStatus: response.status,
        graphError: data?.error || null,
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
    console.error("[IG SEND] unexpected error:", error);

    return {
      ok: false,
      simulated: true,
      error: error?.message || "Erro inesperado ao enviar pela Graph API",
      raw: null,
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
      warning: dispatchResult.ok ? null : dispatchResult.error || "Envio externo não confirmado.",
      graphStatus: dispatchResult.ok ? null : dispatchResult.graphStatus || null,
      graphError: dispatchResult.ok ? null : dispatchResult.graphError || null,
      debug: dispatchResult.ok ? null : dispatchResult.debug || null,
    });
  } catch (error: any) {
    console.error("[api/inbox/send] error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao enviar mensagem" },
      { status: 500 }
    );
  }
}
