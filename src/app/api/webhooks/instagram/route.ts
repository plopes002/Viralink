// src/app/api/webhooks/instagram/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { runAutomationsForEvent } from "@/lib/automationEngine";
import type { InternalSocialEvent } from "@/types/internalSocialEvent";

export async function GET(req: NextRequest) {
  // Handshake do Meta (hub.challenge)
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    console.log("[instagram webhook] verificado.");
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("[instagram webhook] payload bruto:", JSON.stringify(payload));

    // ⚠️ Adaptar para o formato REAL que o Meta entrega
    // Este é um exemplo para "new_follower"
    const entry = payload.entry?.[0];
    if (!entry) {
        return NextResponse.json({ ok: true });
    }

    const igAccountId = entry.id; // ID da conta do Instagram Business
    
    // Supondo que um evento de "follow" venha dentro de "changes"
    const change = entry.changes?.[0];
    if (change?.field !== 'followers') { // Exemplo, o campo pode ser outro
        // Aqui você trataria outros eventos como 'comments', 'messages', etc.
        // return NextResponse.json({ ok: true });
    }

    // O payload de "new_follower" é hipotético aqui, pois o Meta não envia um webhook para isso.
    // Isto é um placeholder para eventos como comentários e mensagens.
    // Para um comentário, seria algo como:
    // const commentId = change.value.id;
    // const text = change.value.text;
    // const fromId = change.value.from.id;
    // const fromUsername = change.value.from.username;
    
    const followerId = String(change?.value?.user_id || 'unknown_user');

    const socialSnap = await adminFirestore
      .collection("socialAccounts")
      .where("network", "==", "instagram")
      .where("accountId", "==", igAccountId)
      .limit(1)
      .get();

    if (socialSnap.empty) {
      console.warn(
        "[instagram webhook] nenhuma socialAccount IG para accountId:",
        igAccountId,
      );
      return NextResponse.json({ ok: true });
    }

    const socialDoc = socialSnap.docs[0];
    const socialData = socialDoc.data() as any;

    const event: InternalSocialEvent = {
      workspaceId: socialData.workspaceId,
      socialAccountId: socialDoc.id,
      network: "instagram",
      type: "new_follower", // O tipo seria dinâmico com base no payload do webhook
      text: "", // Para "new_follower", o texto está vazio
      fromUser: {
        externalId: followerId,
        name: "Unknown Follower", // API do Instagram não fornece nome no follow
        username: "unknown",
      },
      raw: payload,
      receivedAt: new Date().toISOString(),
    };

    await adminFirestore.collection("socialEvents").add(event);

    await runAutomationsForEvent(event);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[instagram webhook] erro:", err);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 },
    );
  }
}
