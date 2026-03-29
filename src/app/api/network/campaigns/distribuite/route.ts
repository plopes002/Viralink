// src/app/api/network/campaigns/distribute/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

type SupporterDoc = {
  status?: string;
  permissions?: {
    allowContentBoost?: boolean;
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, primaryAccountId, campaignId } = body;

    if (!workspaceId || !primaryAccountId || !campaignId) {
      return NextResponse.json(
        { ok: false, error: "Dados obrigatórios não informados." },
        { status: 400 }
      );
    }

    const supportersSnap = await adminFirestore
      .collection("campaignAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("linkedToAccountId", "==", primaryAccountId)
      .get();

    const now = new Date().toISOString();

    const eligibleSupporters = supportersSnap.docs.filter((doc) => {
      const data = doc.data() as SupporterDoc;
      return (
        data.status === "connected" &&
        !!data.permissions?.allowContentBoost
      );
    });

    const existingAssignments = await adminFirestore
      .collection("boostCampaignAssignments")
      .where("campaignId", "==", campaignId)
      .get();

    const existingIds = new Set(
      existingAssignments.docs.map((doc) => String(doc.data().supporterAccountId))
    );

    const batch = adminFirestore.batch();
    let created = 0;

    for (const supporterDoc of eligibleSupporters) {
      if (existingIds.has(supporterDoc.id)) continue;

      const ref = adminFirestore.collection("boostCampaignAssignments").doc();

      batch.set(ref, {
        workspaceId,
        campaignId,
        supporterAccountId: supporterDoc.id,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });

      created += 1;
    }

    if (created > 0) {
      await batch.commit();
    }

    await adminFirestore.collection("boostCampaigns").doc(campaignId).update({
      updatedAt: now,
    });

    return NextResponse.json({
      ok: true,
      distributed: created,
    });
  } catch (error: any) {
    console.error("[campaigns/distribute] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao distribuir campanha." },
      { status: 500 }
    );
  }
}