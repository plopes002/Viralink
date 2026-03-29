// src/app/api/network/primary/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: "Workspace não informado." },
        { status: 400 }
      );
    }

    const snap = await adminFirestore
      .collection("campaignAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("role", "==", "primary")
      .get();

    const accounts = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      ok: true,
      accounts,
    });
  } catch (error: any) {
    console.error("[primary/list] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao listar contas principais." },
      { status: 500 }
    );
  }
}