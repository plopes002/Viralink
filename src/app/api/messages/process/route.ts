// src/app/api/messages/process/route.ts
import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

async function sendInstagramDM(message: any) {
  console.log("[sendInstagramDM] placeholder:", message.toUser, message.content);
  return { ok: true };
}

async function sendFacebookDM(message: any) {
  console.log("[sendFacebookDM] placeholder:", message.toUser, message.content);
  return { ok: true };
}

async function sendWhatsApp(message: any) {
  console.log("[sendWhatsApp] placeholder:", message.toPhone, message.content);
  return { ok: true };
}

async function sendByChannel(message: any) {
  if (message.channel === "instagram_dm") {
    return sendInstagramDM(message);
  }

  if (message.channel === "facebook_dm") {
    return sendFacebookDM(message);
  }

  if (message.channel === "whatsapp") {
    return sendWhatsApp(message);
  }

  throw new Error("Canal não suportado.");
}

async function refreshCampaignStatus(campaignId: string) {
  const snap = await adminFirestore
    .collection("messages")
    .where("campaignId", "==", campaignId)
    .get();

  const items = snap.docs.map((d) => d.data() as any);

  const total = items.length;
  const queued = items.filter((m) => m.status === "queued" || m.status === "scheduled" || m.status === "awaiting_review").length;
  const processing = items.filter((m) => m.status === "processing").length;
  const sent = items.filter((m) => m.status === "sent").length;
  const error = items.filter((m) => m.status === "error").length;

  let campaignStatus: "queued" | "processing" | "done" | "error" = "queued";

  if (error > 0 && sent === 0 && queued === 0 && processing === 0) {
    campaignStatus = "error";
  } else if (queued === 0 && processing === 0 && (sent + error) === total) {
    campaignStatus = "done";
  } else if (processing > 0 || sent > 0 || error > 0) {
    campaignStatus = "processing";
  }

  await adminFirestore.collection("campaigns").doc(campaignId).update({
    status: campaignStatus,
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const now = new Date().toISOString();
    const snap = await adminFirestore
      .collection("messages")
      .where("status", "==", "scheduled")
      .where("scheduledAt", "<=", now)
      .limit(10)
      .get();

    const docs = snap.docs;

    if (!docs.length) {
      return NextResponse.json({
        ok: true,
        processed: 0,
        note: "Nenhuma mensagem agendada para agora.",
      });
    }

    const touchedCampaigns = new Set<string>();

    for (const docSnap of docs) {
      const message = { id: docSnap.id, ...(docSnap.data() as any) };

      try {
        await docSnap.ref.update({
          status: "processing",
          updatedAt: new Date().toISOString(),
        });

        const result = await sendByChannel(message);

        if (!result.ok) {
          throw new Error("Falha no envio.");
        }

        await docSnap.ref.update({
          status: "sent",
          errorMessage: null,
          updatedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        await docSnap.ref.update({
          status: "error",
          errorMessage: err?.message || "Erro ao enviar mensagem.",
          updatedAt: new Date().toISOString(),
        });
      }

      if (message.campaignId) {
        touchedCampaigns.add(message.campaignId);
      }
    }

    for (const campaignId of touchedCampaigns) {
      await refreshCampaignStatus(campaignId);
    }

    return NextResponse.json({
      ok: true,
      processed: docs.length,
    });
  } catch (err) {
    console.error("[messages process] erro:", err);
    return NextResponse.json(
      { error: "Erro ao processar mensagens." },
      { status: 500 },
    );
  }
}
