// src/app/api/network/automation-rules/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const primaryAccountId = req.nextUrl.searchParams.get("primaryAccountId");

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId é obrigatório." },
        { status: 400 }
      );
    }

    let query: FirebaseFirestore.Query = adminFirestore
      .collection("interactionAutomationRules")
      .where("workspaceId", "==", workspaceId);

    if (primaryAccountId) {
      query = query.where("primaryAccountId", "==", primaryAccountId);
    }

    const snap = await query.get();

    const rules = snap.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }))
      .sort((a: any, b: any) => {
        const pa = Number(a.priority || 100);
        const pb = Number(b.priority || 100);

        if (pa !== pb) return pa - pb;

        return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      });

    return NextResponse.json({
      ok: true,
      rules,
    });
  } catch (error: any) {
    console.error("[automation-rules/list] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao listar regras." },
      { status: 500 }
    );
  }
}