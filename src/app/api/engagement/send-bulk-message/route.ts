import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      workspaceId,
      category,
      message,
    }: {
      workspaceId?: string;
      category?: string;
      message?: string;
    } = body;

    if (!workspaceId || !category || !message) {
      return NextResponse.json(
        { error: "workspaceId, category e message são obrigatórios." },
        { status: 400 },
      );
    }

    const snap = await adminFirestore
      .collection("engagements")
      .where("workspaceId", "==", workspaceId)
      .get();

    const recipients = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((item: any) => Array.isArray(item.categories) && item.categories.includes(category));

    // proteção simples anti-volume exagerado
    const MAX_BULK_SEND = 50;
    const limitedRecipients = recipients.slice(0, MAX_BULK_SEND);

    for (const recipient of limitedRecipients) {
      await adminFirestore.collection("messages").add({
        workspaceId,
        toUser: recipient.username,
        toPhone: recipient.phone || null,
        category,
        channel: recipient.phone ? "whatsapp" : "instagram_dm",
        content: message,
        status: "queued",
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      queued: limitedRecipients.length,
      note:
        recipients.length > MAX_BULK_SEND
          ? `Foram enfileirados ${MAX_BULK_SEND} contatos por segurança.`
          : "Mensagens enfileiradas com sucesso.",
    });
  } catch (err) {
    console.error("[send-bulk-message] erro:", err);
    return NextResponse.json(
      { error: "Erro ao disparar mensagens em lote." },
      { status: 500 },
    );
  }
}
