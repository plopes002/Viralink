// src/app/api/dashboard/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

type SupportedNetwork = "instagram" | "facebook" | "whatsapp";
type SocialAccountDoc = {
  workspaceId: string;
  network: SupportedNetwork;
  accountType?: "profile" | "page";
  status?: string;
};

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

async function getConnectedAccounts(
  workspaceId: string,
  network?: string | null,
  socialAccountId?: string | null
) {
  if (socialAccountId) {
    const doc = await adminFirestore.collection("socialAccounts").doc(socialAccountId).get();

    if (!doc.exists) return [];

    const data = doc.data() as SocialAccountDoc;

    if (data.workspaceId !== workspaceId) return [];
    if (data.status !== "connected") return [];
    if (network && network !== "all" && data.network !== network) return [];

    return [{ id: doc.id, ...data }];
  }

  let query: FirebaseFirestore.Query = adminFirestore
    .collection("socialAccounts")
    .where("workspaceId", "==", workspaceId)
    .where("status", "==", "connected");

  if (network && network !== "all") {
    query = query.where("network", "==", network);
  }

  const snap = await query.get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as SocialAccountDoc),
  }));
}

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const network = req.nextUrl.searchParams.get("network");
    const socialAccountId = req.nextUrl.searchParams.get("socialAccountId");
    const days = Number(req.nextUrl.searchParams.get("days") || "7");

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, message: "workspaceId obrigatório" },
        { status: 400 }
      );
    }

    const accounts = await getConnectedAccounts(workspaceId, network, socialAccountId);

    if (!accounts.length) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const byDate = new Map<
      string,
      { dateKey: string; followersCount: number; mediaCount: number }
    >();

    for (const account of accounts) {
      let collectionName: string | null = null;

      if (account.network === "instagram") {
        collectionName = "instagramInsightsHistory";
      } else if (account.network === "facebook") {
        collectionName = "facebookInsightsHistory";
      }

      if (!collectionName) continue;

      const snap = await adminFirestore
        .collection(collectionName)
        .where("workspaceId", "==", workspaceId)
        .where("socialAccountId", "==", account.id)
        .get();

      for (const doc of snap.docs) {
        const item = doc.data() as any;
        const dateKey = String(item.dateKey || "");

        if (!dateKey) continue;

        const existing = byDate.get(dateKey) || {
          dateKey,
          followersCount: 0,
          mediaCount: 0,
        };

        existing.followersCount += toNumber(item.followersCount, 0);
        existing.mediaCount += toNumber(item.mediaCount, 0);

        byDate.set(dateKey, existing);
      }
    }

    const items = Array.from(byDate.values())
      .sort((a, b) => String(a.dateKey).localeCompare(String(b.dateKey)))
      .slice(-days);

    return NextResponse.json({
      ok: true,
      data: items,
    });
  } catch (error) {
    console.error("[dashboard/history API]", error);
    const message =
      error instanceof Error ? error.message : "Erro desconhecido no servidor.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}