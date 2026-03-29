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

    const primaryCampaignSnap = await adminFirestore
      .collection("campaignAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("role", "==", "primary")
      .limit(1)
      .get();

    if (primaryCampaignSnap.empty) {
      return NextResponse.json(
        { ok: false, message: "Conta principal não encontrada" },
        { status: 404 }
      );
    }

    const primaryCampaign = primaryCampaignSnap.docs[0].data() as any;
let socialAccountId = primaryCampaign.socialAccountId || null;

if (!socialAccountId) {
  const fallbackSnap = await adminFirestore
    .collection("socialAccounts")
    .where("workspaceId", "==", workspaceId)
    .where("network", "==", "instagram")
    .where("isPrimary", "==", true)
    .limit(1)
    .get();

  if (fallbackSnap.empty) {
    return NextResponse.json(
      { ok: false, message: "Conta principal sem socialAccountId" },
      { status: 400 }
    );
  }

  socialAccountId = fallbackSnap.docs[0].id;
}

    const snap = await adminFirestore
      .collection("instagramInsightsHistory")
      .where("workspaceId", "==", workspaceId)
      .where("socialAccountId", "==", socialAccountId)
      .get();

    const items = snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
      .sort((a: any, b: any) => String(a.dateKey).localeCompare(String(b.dateKey)))
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