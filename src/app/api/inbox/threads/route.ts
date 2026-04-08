// src/app/api/inbox/threads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const socialAccountId = req.nextUrl.searchParams.get("socialAccountId");
    const status = req.nextUrl.searchParams.get("status");
    const search = (req.nextUrl.searchParams.get("search") || "").trim().toLowerCase();

    if (!workspaceId || !socialAccountId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId e socialAccountId são obrigatórios" },
        { status: 400 }
      );
    }

    let query: FirebaseFirestore.Query = adminFirestore
      .collection("inboxThreads")
      .where("workspaceId", "==", workspaceId)
      .where("socialAccountId", "==", socialAccountId);

    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }

    const snap = await query.orderBy("lastMessageAt", "desc").limit(100).get();

    let threads = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString?.() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
      };
    });

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
