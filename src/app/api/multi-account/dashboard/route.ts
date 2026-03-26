// src/app/api/multi-account/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { getMasterScopeWorkspaceIds } from "@/lib/multiAccountScope";

async function countWhereInCollection(
  collectionName: string,
  workspaceIds: string[],
) {
  if (workspaceIds.length === 0) return 0;
  
  const counts = await Promise.all(
    workspaceIds.map(async (workspaceId) => {
      const snap = await adminFirestore
        .collection(collectionName)
        .where("workspaceId", "==", workspaceId)
        .get();
      return snap.size;
    }),
  );

  return counts.reduce((sum, value) => sum + value, 0);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masterWorkspaceId = searchParams.get("masterWorkspaceId");

    if (!masterWorkspaceId) {
      return NextResponse.json(
        { error: "masterWorkspaceId é obrigatório." },
        { status: 400 },
      );
    }

    const workspaceIds = await getMasterScopeWorkspaceIds(masterWorkspaceId);

    const [
      totalContacts,
      totalProfiles,
      totalCampaigns,
      totalCompetitorLeads,
      totalSocialAccounts,
    ] = await Promise.all([
      countWhereInCollection("contacts", workspaceIds),
      countWhereInCollection("engagementProfiles", workspaceIds),
      countWhereInCollection("campaigns", workspaceIds),
      countWhereInCollection("competitorLeads", workspaceIds),
      countWhereInCollection("socialAccounts", workspaceIds),
    ]);

    return NextResponse.json({
      ok: true,
      workspaceIds,
      totals: {
        totalContacts,
        totalProfiles,
        totalCampaigns,
        totalCompetitorLeads,
        totalSocialAccounts,
      },
    });
  } catch (err) {
    console.error("[multi-account dashboard] erro:", err);
    return NextResponse.json(
      { error: "Erro ao carregar dashboard multi-conta." },
      { status: 500 },
    );
  }
}
