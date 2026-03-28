// src/app/api/instagram/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, message: "workspaceId obrigatório" },
        { status: 400 }
      );
    }

    const snap = await adminFirestore
      .collection("instagramInsightsHistory")
      .where("workspaceId", "==", workspaceId)
      .get();

    const items = snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .slice(-7);

    return NextResponse.json({
      ok: true,
      data: items,
    });
  } catch (error) {
    console.error("[instagram history API]", error);
    const message =
      error instanceof Error ? error.message : "Erro desconhecido no servidor.";

    return NextResponse.json(
      { ok: false, message },
      { status: 500 }
    );
  }
}
