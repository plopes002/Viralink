// src/app/api/network/automation-rules/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const primaryAccountId = req.nextUrl.searchParams.get("primaryAccountId");

    if (!workspaceId || !primaryAccountId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId e primaryAccountId são obrigatórios." },
        { status: 400 }
      );
    }

    const snap = await adminFirestore
      .collection("interactionAutomationRules")
      .where("workspaceId", "==", workspaceId)
      .where("primaryAccountId", "==", primaryAccountId)
      .get();

    const rules = snap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) =>
        String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
      );

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