// src/app/api/scheduled-posts/process/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { publishImageToInstagram } from "@/lib/instagramPublishing";

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

async function publishToInstagram(post: ScheduledPostDoc) {
  const socialSnap = await adminFirestore
    .collection("socialAccounts")
    .where("workspaceId", "==", post.workspaceId)
    .where("network", "==", "instagram")
    .where("status", "==", "connected")
    .limit(1)
    .get();

  if (socialSnap.empty) {
    throw new Error("Conta Instagram conectada não encontrada.");
  }

  const social = socialSnap.docs[0].data() as any;

  const igUserId = social.accountId;
  const accessToken = social.pageAccessToken || social.accessToken || "";
  const caption = post.content?.text?.trim() || "";
  const mediaType = post.content?.mediaType || "none";
  const imageUrl = post.content?.mediaUrl || "";

  if (!imageUrl) {
    throw new Error("mediaUrl ausente para publicação no Instagram.");
  }

  if (mediaType !== "image") {
    throw new Error(
      "Neste primeiro passo, só imagem única está habilitada para Instagram."
    );
  }

  return publishImageToInstagram({
    igUserId,
    accessToken,
    caption,
    imageUrl,
  });
}

async function processPost(docId: string, data: ScheduledPostDoc) {
  const ref = adminFirestore.collection("scheduledPosts").doc(docId);

  try {
    await ref.update({
      status: "processing",
      lastError: null,
      updatedAt: new Date().toISOString(),
    });

    const networks = Array.isArray(data.networks) ? data.networks : [];

    if (!networks.length) {
      throw new Error("Nenhuma rede configurada no agendamento.");
    }

    const publishResults: Array<{ network: string; mediaId?: string }> = [];

    for (const network of networks) {
      if (network !== "instagram") {
        throw new Error(`Rede ainda não implementada: ${network}`);
      }

      const result = await publishToInstagram(data);

      publishResults.push({
        network,
        mediaId: result?.mediaId,
      });
    }

    await ref.update({
      status: "sent",
      lastError: null,
      sentAt: new Date().toISOString(),
      publishResults,
      updatedAt: new Date().toISOString(),
    });

    return {
      id: docId,
      ok: true,
    };
  } catch (error: any) {
    const safeMessage =
      error?.message || "Erro ao publicar post agendado.";

    console.error("[scheduled-posts/process] erro no post:", {
      docId,
      error: safeMessage,
    });

    try {
      await ref.update({
        status: "failed",
        lastError: safeMessage,
        updatedAt: new Date().toISOString(),
      });
    } catch (updateError: any) {
      console.error("[scheduled-posts/process] erro ao marcar failed:", {
        docId,
        error: updateError?.message || updateError,
      });
    }

    return {
      id: docId,
      ok: false,
      error: safeMessage,
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

    const results: Array<{
      id: string;
      ok: boolean;
      error?: string;
    }> = [];

    for (const doc of dueDocs) {
      try {
        const data = doc.data() as ScheduledPostDoc;
        const result = await processPost(doc.id, data);
        results.push(result);
      } catch (error: any) {
        const safeMessage =
          error?.message || "Erro inesperado ao processar post.";

        console.error("[scheduled-posts/process] erro fora de processPost:", {
          docId: doc.id,
          error: safeMessage,
        });

        try {
          await adminFirestore.collection("scheduledPosts").doc(doc.id).update({
            status: "failed",
            lastError: safeMessage,
            updatedAt: new Date().toISOString(),
          });
        } catch (updateError: any) {
          console.error(
            "[scheduled-posts/process] erro extra ao marcar failed:",
            {
              docId: doc.id,
              error: updateError?.message || updateError,
            }
          );
        }

        results.push({
          id: doc.id,
          ok: false,
          error: safeMessage,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("[scheduled-posts/process] erro fatal:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao processar fila de posts agendados.",
      },
      { status: 500 }
    );
  }
}