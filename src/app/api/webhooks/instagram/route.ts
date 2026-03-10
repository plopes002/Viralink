// src/app/api/webhooks/instagram/route.ts
import 'server-only';
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
    const igAccountId = String(payload.ig_account_id || payload.account_id);
    const followerId = String(payload.user_id);
    const followerUsername = payload.username || "";
    const followerName = payload.full_name || "";

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
      type: "new_follower",
      text: "",
      fromUser: {
        externalId: followerId,
        name: followerName,
        username: followerUsername,
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
