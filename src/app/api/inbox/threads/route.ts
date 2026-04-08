// src/app/api/inbox/threads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

function normalizeDate(value: any) {
  try {
    return value?.toDate?.()?.toISOString?.() || null;
  } catch {
    return null;
  }
}

function sortThreadsByLastMessageAtDesc(items: any[]) {
  return items.sort((a, b) => {
    const aTime = a?.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b?.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const socialAccountId = req.nextUrl.searchParams.get("socialAccountId");
    const status = req.nextUrl.searchParams.get("status");
    const search = (req.nextUrl.searchParams.get("search") || "")
      .trim()
      .toLowerCase();

    if (!workspaceId || !socialAccountId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId e socialAccountId são obrigatórios" },
        { status: 400 }
      );
    }

    let threads: any[] = [];

    try {
      let query: FirebaseFirestore.Query = adminFirestore
        .collection("inboxThreads")
        .where("workspaceId", "==", workspaceId)
        .where("socialAccountId", "==", socialAccountId);

      if (status && status !== "all") {
        query = query.where("status", "==", status);
      }

      const snap = await query
        .orderBy("lastMessageAt", "desc")
        .limit(100)
        .get();

      threads = snap.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data,
          lastMessageAt: normalizeDate(data.lastMessageAt),
          createdAt: normalizeDate(data.createdAt),
          updatedAt: normalizeDate(data.updatedAt),
        };
      });
    } catch (err: any) {
      const message = String(err?.message || "");
      const needsIndex =
        message.includes("The query requires an index") ||
        message.includes("FAILED_PRECONDITION");

      if (!needsIndex) {
        throw err;
      }

      console.warn(
        "[api/inbox/threads] índice ausente, usando fallback sem orderBy no Firestore"
      );

      let fallbackQuery: FirebaseFirestore.Query = adminFirestore
        .collection("inboxThreads")
        .where("workspaceId", "==", workspaceId)
        .where("socialAccountId", "==", socialAccountId);

      if (status && status !== "all") {
        fallbackQuery = fallbackQuery.where("status", "==", status);
      }

      const snap = await fallbackQuery.limit(100).get();

      threads = snap.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data,
          lastMessageAt: normalizeDate(data.lastMessageAt),
          createdAt: normalizeDate(data.createdAt),
          updatedAt: normalizeDate(data.updatedAt),
        };
      });

      threads = sortThreadsByLastMessageAtDesc(threads);
    }

    if (search) {
      threads = threads.filter((thread: any) => {
        const name = (thread.customerName || "").toLowerCase();
        const username = (thread.customerUsername || "").toLowerCase();
        const lastMessageText = (thread.lastMessageText || "").toLowerCase();

        return (
          name.includes(search) ||
          username.includes(search) ||
          lastMessageText.includes(search)
        );
      });
    }

    return NextResponse.json({
      ok: true,
      threads,
    });
  } catch (error: any) {
    console.error("[api/inbox/threads] error:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao listar conversas" },
      { status: 500 }
    );
  }
}
