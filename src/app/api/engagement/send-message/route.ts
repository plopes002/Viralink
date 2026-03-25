import 'server-only';
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { username, message } = body;

    // 🔒 placeholder (simula envio)
    console.log(`Enviando mensagem para: ${username}, Mensagem: ${message}`);

    return NextResponse.json({
      success: true,
      message: "Mensagem enviada com sucesso"
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao enviar mensagem" },
      { status: 500 }
    );
  }
}
