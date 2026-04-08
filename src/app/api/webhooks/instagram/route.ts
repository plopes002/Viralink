// src/app/api/webhooks/instagram/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ingestInstagramWebhookPayload } from "@/lib/meta-inbox-webhook";

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

    console.log("[webhooks/instagram][GET] mode:", mode);
    console.log("[webhooks/instagram][GET] token ok:", token === getVerifyToken());

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

    console.log("[webhooks/instagram][POST] object:", body?.object);
    console.log(
      "[webhooks/instagram][POST] payload:",
      JSON.stringify(body, null, 2)
    );

    const acceptedObjects = ["instagram", "page", "whatsapp_business_account"];

    if (!acceptedObjects.includes(String(body?.object || ""))) {
      console.log("[webhooks/instagram][POST] ignored unsupported object");
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "unsupported_object",
      });
    }

    const ingestion = await ingestInstagramWebhookPayload(body);

    console.log(
      "[webhooks/instagram][POST] ingestion result:",
      JSON.stringify(ingestion, null, 2)
    );

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
