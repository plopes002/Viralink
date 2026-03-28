// src/app/api/scheduled-posts/process/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

type ScheduledPostDoc = {
  workspaceId: string;
  ownerId?: string;
  networks?: string[];
  content?: {
    text?: string;
    mediaType?: "image" | "video" | "none";
    mediaUrl?: string | null;
  };
  timeZone?: string;
  runAt?: any;
  status?: "pending" | "processing" | "sent" | "failed";
  lastError?: string | null;
  createdAt?: any;
  updatedAt?: any;
};

function getRunAtDate(runAt: any): Date | null {
  if (!runAt) return null;

  if (runAt instanceof Date) {
    return Number.isNaN(runAt.getTime()) ? null : runAt;
  }

  if (typeof runAt?.toDate === "function") {
    const parsed = runAt.toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime())
      ? parsed
      : null;
  }

  if (typeof runAt?.seconds === "number") {
    const parsed = new Date(runAt.seconds * 1000);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(runAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Placeholder de publicação real.
 * Aqui depois vamos trocar por integração oficial:
 * - Instagram Graph API
 * - Facebook Graph API
 * - WhatsApp Cloud API
 */
async function publishToNetwork(post: ScheduledPostDoc, network: string) {
  const text = post.content?.text?.trim() ?? "";
  const mediaType = post.content?.mediaType ?? "none";
  const mediaUrl = post.content?.mediaUrl ?? null;

  if (!text && mediaType === "none") {
    throw new Error(`Post sem conteúdo para publicar em ${network}.`);
  }

  console.log("[scheduled-posts/process] publish placeholder", {
    network,
    text,
    mediaType,
    mediaUrl,
  });

  return {
    ok: true,
    network,
  };
}

async function processPost(docId: string, data: ScheduledPostDoc) {
  const ref = adminFirestore.collection("scheduledPosts").doc(docId);

  await ref.update({
    status: "processing",
    lastError: null,
    updatedAt: new Date().toISOString(),
  });

  try {
    const networks = Array.isArray(data.networks) ? data.networks : [];

    if (!networks.length) {
      throw new Error("Nenhuma rede configurada no agendamento.");
    }

    for (const network of networks) {
      await publishToNetwork(data, network);
    }

    await ref.update({
      status: "sent",
      lastError: null,
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { id: docId, ok: true };
  } catch (error: any) {
    await ref.update({
      status: "failed",
      lastError: error?.message || "Erro ao publicar post agendado.",
      updatedAt: new Date().toISOString(),
    });

    return {
      id: docId,
      ok: false,
      error: error?.message || "Erro ao publicar post agendado.",
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.SCHEDULED_POSTS_CRON_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { ok: false, error: "SCHEDULED_POSTS_CRON_TOKEN não configurado." },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { ok: false, error: "Não autorizado." },
        { status: 401 }
      );
    }

    const now = new Date();

    const snap = await adminFirestore
      .collection("scheduledPosts")
      .where("status", "==", "pending")
      .limit(20)
      .get();

    const dueDocs = snap.docs.filter((doc) => {
      const data = doc.data() as ScheduledPostDoc;
      const runAt = getRunAtDate(data.runAt);
      if (!runAt) return false;
      return runAt.getTime() <= now.getTime();
    });

    if (!dueDocs.length) {
      return NextResponse.json({
        ok: true,
        processed: 0,
        note: "Nenhum post pendente para publicar agora.",
      });
    }

    const results = [];
    for (const doc of dueDocs) {
      const data = doc.data() as ScheduledPostDoc;
      const result = await processPost(doc.id, data);
      results.push(result);
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("[scheduled-posts/process] erro:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao processar fila de posts agendados.",
      },
      { status: 500 }
    );
  }
}
