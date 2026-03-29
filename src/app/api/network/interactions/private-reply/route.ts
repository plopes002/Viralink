// src/app/api/network/interactions/private-reply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

async function sendInstagramPrivateReply(params: {
  pageId: string;
  commentId: string;
  message: string;
  accessToken: string;
}) {
  const { pageId, commentId, message, accessToken } = params;

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: {
          comment_id: commentId,
        },
        message: {
          text: message,
        },
        access_token: accessToken,
      }),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Erro ao enviar resposta privada."
    );
  }

  return data;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { interactionId, message } = body;

    if (!interactionId || !message?.trim()) {
      return NextResponse.json(
        { ok: false, error: "interactionId e message são obrigatórios." },
        { status: 400 }
      );
    }

    const interactionRef = adminFirestore
      .collection("supporterInteractions")
      .doc(interactionId);

    const interactionDoc = await interactionRef.get();

    if (!interactionDoc.exists) {
      return NextResponse.json(
        { ok: false, error: "Interação não encontrada." },
        { status: 404 }
      );
    }

    const interaction = interactionDoc.data() as any;

    if (!interaction.externalCommentId) {
      return NextResponse.json(
        { ok: false, error: "externalCommentId não encontrado." },
        { status: 400 }
      );
    }

    const sourceCampaignAccountId = interaction.sourceCampaignAccountId;
    if (!sourceCampaignAccountId) {
      return NextResponse.json(
        { ok: false, error: "Conta de origem da interação não encontrada." },
        { status: 400 }
      );
    }

    const campaignAccountDoc = await adminFirestore
      .collection("campaignAccounts")
      .doc(sourceCampaignAccountId)
      .get();

    if (!campaignAccountDoc.exists) {
      return NextResponse.json(
        { ok: false, error: "campaignAccount não encontrado." },
        { status: 404 }
      );
    }

    const campaignAccount = campaignAccountDoc.data() as any;
    const socialAccountId = campaignAccount.socialAccountId;

    if (!socialAccountId) {
      return NextResponse.json(
        { ok: false, error: "A conta de origem não possui socialAccountId." },
        { status: 400 }
      );
    }

    const socialAccountDoc = await adminFirestore
      .collection("socialAccounts")
      .doc(socialAccountId)
      .get();

    if (!socialAccountDoc.exists) {
      return NextResponse.json(
        { ok: false, error: "socialAccount vinculada não encontrada." },
        { status: 404 }
      );
    }

    const socialAccount = socialAccountDoc.data() as any;

    const pageId = socialAccount.facebookPageId || "";
    const accessToken =
      socialAccount.pageAccessToken || socialAccount.accessToken || "";

    if (!pageId) {
      return NextResponse.json(
        { ok: false, error: "facebookPageId não encontrado na conta conectada." },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Token da conta não encontrado." },
        { status: 400 }
      );
    }

    const result = await sendInstagramPrivateReply({
      pageId,
      commentId: interaction.externalCommentId,
      message: String(message).trim(),
      accessToken,
    });

    await interactionRef.set(
      {
        status: "private_replied",
        privateReplyText: String(message).trim(),
        privateReplyMeta: {
          messageId: result?.message_id || result?.id || null,
          sentAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error: any) {
    console.error("[network/interactions/private-reply] erro:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao enviar resposta privada.",
      },
      { status: 500 }
    );
  }
}