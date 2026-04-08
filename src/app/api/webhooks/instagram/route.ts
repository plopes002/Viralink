// src/app/api/webhooks/instagram/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ingestInstagramWebhookPayload } from "@/lib/meta-inbox-webhook";

// Se você já tiver uma função de automação, descomente e ajuste o import.
// import { runAutomationsForEvent } from "@/lib/automations";

function getVerifyToken() {
  return (
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
    process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ||
    process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ||
    ""
  );
}

export async function GET(req: NextRequest) {
  try {
    const mode = req.nextUrl.searchParams.get("hub.mode");
    const token = req.nextUrl.searchParams.get("hub.verify_token");
    const challenge = req.nextUrl.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === getVerifyToken()) {
      return new NextResponse(challenge || "ok", { status: 200 });
    }

    return new NextResponse("Forbidden", { status: 403 });
  } catch (error) {
    console.error("[webhooks/instagram][GET] error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Aceita tanto payload oficial do objeto instagram quanto variações
    // que a Meta pode entregar via integração do Messenger.
    const acceptedObjects = ["instagram", "page", "whatsapp_business_account"];

    if (!acceptedObjects.includes(String(body?.object || ""))) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "unsupported_object",
      });
    }

    const ingestion = await ingestInstagramWebhookPayload(body);

    // Se você já tiver automações funcionando por evento, encaixe aqui.
    // Exemplo:
    //
    // for (const result of ingestion.results) {
    //   if (!result.ok) continue;
    //   await runAutomationsForEvent({
    //     type: "instagram_dm_received",
    //     workspaceId: result.workspaceId,
    //     socialAccountId: result.socialAccountId,
    //     threadId: result.threadId,
    //     messageId: result.messageId,
    //   });
    // }

    return NextResponse.json({
      ok: true,
      processed: ingestion.processed,
      results: ingestion.results,
    });
  } catch (error: any) {
    console.error("[webhooks/instagram][POST] error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao processar webhook do Instagram",
      },
      { status: 500 }
    );
  }
}
