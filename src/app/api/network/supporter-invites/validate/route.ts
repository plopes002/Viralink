// src/app/api/network/supporter-invites/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Token não informado." },
        { status: 400 }
      );
    }

    const snap = await adminFirestore
      .collection("supporterInvites")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { ok: false, error: "Convite não encontrado." },
        { status: 404 }
      );
    }

    const doc = snap.docs[0];
    const data = doc.data();

    if (data.status !== "pending") {
      return NextResponse.json(
        { ok: false, error: "Convite já utilizado ou inválido." },
        { status: 400 }
      );
    }

    if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, error: "Convite expirado." },
        { status: 400 }
      );
    }

    const primarySnap = await adminFirestore
      .collection("campaignAccounts")
      .doc(data.primaryAccountId)
      .get();

    const primaryData = primarySnap.exists ? primarySnap.data() : null;

    return NextResponse.json({
      ok: true,
      invite: {
        id: doc.id,
        workspaceId: data.workspaceId,
        primaryAccountId: data.primaryAccountId,
        supporterName: data.supporterName || null,
        primaryAccountName: primaryData?.name || "Conta principal",
        primaryUsername: primaryData?.username || "",
        network: data.network === "facebook" ? "facebook" : "instagram",
      },
    });
  } catch (error: any) {
    console.error("[supporter-invites/validate] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao validar convite." },
      { status: 500 }
    );
  }
}