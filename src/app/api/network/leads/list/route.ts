// src/app/api/network/leads/list/route.ts
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

    const leadsSnap = await adminFirestore
      .collection("supporterLeads")
      .where("workspaceId", "==", workspaceId)
      .where("primaryAccountId", "==", primaryAccountId)
      .get();

    const sourceIds = Array.from(
      new Set(
        leadsSnap.docs
          .map((doc) => String(doc.data().sourceCampaignAccountId || ""))
          .filter(Boolean)
      )
    );

    const sourceDocs = await Promise.all(
      sourceIds.map((id) =>
        adminFirestore.collection("campaignAccounts").doc(id).get()
      )
    );

    const sourceMap = new Map(
      sourceDocs
        .filter((doc) => doc.exists)
        .map((doc) => [doc.id, doc.data()])
    );

    const leads = leadsSnap.docs
      .map((doc) => {
        const data = doc.data() as any;
        const source = sourceMap.get(String(data.sourceCampaignAccountId)) as any;

        return {
          id: doc.id,
          ...data,
          sourceName: source?.name || "Conta",
          sourceUsername: source?.username || "",
        };
      })
      .sort((a: any, b: any) =>
        String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
      );

    return NextResponse.json({
      ok: true,
      leads,
    });
  } catch (error: any) {
    console.error("[leads/list] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao listar leads." },
      { status: 500 }
    );
  }
}