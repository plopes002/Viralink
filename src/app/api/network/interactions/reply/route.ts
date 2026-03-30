// src/app/api/network/interactions/reply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

async function replyToInstagramComment(params: {
  commentId: string;
  message: string;
  accessToken: string;
}) {
  const { commentId, message, accessToken } = params;

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${encodeURIComponent(commentId)}/replies`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        message,
        access_token: accessToken,
      }).toString(),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Erro ao responder comentário no Instagram."
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
        { ok: false, error: "Comentário externo não encontrado." },
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
        { ok: false, error: "campaignAccount da interação não encontrado." },
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
    const accessToken =
      socialAccount.pageAccessToken || socialAccount.accessToken || "";

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Token da conta não encontrado." },
        { status: 400 }
      );
    }

    const metaResult = await replyToInstagramComment({
      commentId: interaction.externalCommentId,
      message: String(message).trim(),
      accessToken,
    });

    await interactionRef.set(
      {
        status: "replied",
        publicReplyText: String(message).trim(),
        replyMeta: {
          replyId: metaResult?.id || null,
          repliedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      result: metaResult,
    });
  } catch (error: any) {
    console.error("[network/interactions/reply] erro:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao responder comentário.",
      },
      { status: 500 }
    );
  }
}
