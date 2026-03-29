// src/app/api/network/interactions/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const primaryAccountId = req.nextUrl.searchParams.get("primaryAccountId");
    const status = req.nextUrl.searchParams.get("status");

    if (!workspaceId || !primaryAccountId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId e primaryAccountId são obrigatórios." },
        { status: 400 }
      );
    }

    const snap = await adminFirestore
      .collection("supporterInteractions")
      .where("workspaceId", "==", workspaceId)
      .where("primaryAccountId", "==", primaryAccountId)
      .get();

    let items = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    if (status && status !== "all") {
      items = items.filter((item) => item.status === status);
    }

    items.sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );

    return NextResponse.json({
      ok: true,
      interactions: items,
    });
  } catch (error: any) {
    console.error("[interactions/list] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao listar interações." },
      { status: 500 }
    );
  }
}