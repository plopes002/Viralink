// src/app/api/social-accounts/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const network = req.nextUrl.searchParams.get("network") || "instagram";

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId obrigatório" },
        { status: 400 }
      );
    }

    const snap = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("network", "==", network)
      .where("status", "==", "connected")
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
    console.error("[api/social-accounts/list] error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao listar contas" },
      { status: 500 }
    );
  }
}
