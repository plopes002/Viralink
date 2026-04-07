// src/app/api/whatsapp/send/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json(
        { ok: false, error: "Dados inválidos" },
        { status: 400 }
      );
    }

    console.log("📱 WhatsApp envio (simulado):", {
      phone,
      message,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      status: "sent",
      simulated: true,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Erro ao enviar mensagem" },
      { status: 500 }
    );
  }
}
