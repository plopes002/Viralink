// src/app/api/network/campaigns/assignments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const campaignId = req.nextUrl.searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: "campaignId não informado." },
        { status: 400 }
      );
    }

    const assignmentsSnap = await adminFirestore
      .collection("boostCampaignAssignments")
      .where("campaignId", "==", campaignId)
      .get();

    const supporterIds = assignmentsSnap.docs
      .map((doc) => String(doc.data().supporterAccountId))
      .filter(Boolean);

    const supporters = await Promise.all(
      supporterIds.map((id) =>
        adminFirestore.collection("campaignAccounts").doc(id).get()
      )
    );

    const supporterMap = new Map(
      supporters
        .filter((doc) => doc.exists)
        .map((doc) => [doc.id, doc.data()])
    );

    const assignments = assignmentsSnap.docs.map((doc) => {
      const data = doc.data();
      const supporter = supporterMap.get(String(data.supporterAccountId)) as any;

      return {
        id: doc.id,
        ...data,
        supporterName: supporter?.name || "Apoiador",
        supporterUsername: supporter?.username || "",
      };
    });

    return NextResponse.json({
      ok: true,
      assignments,
    });
  } catch (error: any) {
    console.error("[campaigns/assignments] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao listar distribuição." },
      { status: 500 }
    );
  }
}