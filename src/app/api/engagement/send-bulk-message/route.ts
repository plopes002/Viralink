import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      workspaceId,
      category,
      users,
      message,
    }: {
      workspaceId?: string;
      category?: string;
      users?: { username: string; phone?: string | null }[];
      message?: string;
    } = body;

    if (!workspaceId || !message || (!users && !category)) {
      return NextResponse.json(
        { error: "workspaceId, message e (users ou category) são obrigatórios." },
        { status: 400 },
      );
    }

    let recipients: any[] = [];

    if (users) {
      recipients = users;
    } else if (category) {
      const snap = await adminFirestore
        .collection("engagements")
        .where("workspaceId", "==", workspaceId)
        .where("categories", "array-contains", category)
        .get();
      recipients = snap.docs.map((d) => d.data());
    }

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
