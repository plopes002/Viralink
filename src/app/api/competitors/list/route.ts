// src/app/api/competitors/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId é obrigatório." },
        { status: 400 }
      );
    }

    const snap = await adminFirestore
      .collection("competitorAccounts")
      .where("workspaceId", "==", workspaceId)
      .get();

    const competitors = snap.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }))
      .sort((a: any, b: any) =>
        String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
      );

    return NextResponse.json({
      ok: true,
      competitors,
    });
  } catch (error: any) {
    console.error("[competitors/list] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao listar concorrentes." },
      { status: 500 }
    );
  }
}