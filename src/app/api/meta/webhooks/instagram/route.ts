// src/app/api/meta/webhooks/instagram/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { syncInstagramCommentsForSocialAccount } from "@/lib/instagramCommentsSync";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    token === process.env.META_WEBHOOK_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge || "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object !== "instagram") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const socialSnap = await adminFirestore
      .collection("socialAccounts")
      .where("network", "==", "instagram")
      .where("isPrimary", "==", true)
      .get();

    const jobs = socialSnap.docs.map(async (doc) => {
      const social = doc.data() as any;
      const accessToken = social.pageAccessToken || social.accessToken || "";

      if (!social.workspaceId || !social.accountId || !accessToken) {
        return null;
      }

      return syncInstagramCommentsForSocialAccount({
        workspaceId: social.workspaceId,
        socialAccountId: doc.id,
        accountId: social.accountId,
        accessToken,
        sourceRole: "primary",
        sourceCampaignAccountId: null,
        sourceName: social.name || "Conta principal",
        sourceUsername: social.username || "",
      });
    });

    await Promise.all(jobs);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[meta/webhooks/instagram] erro:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro no webhook." },
      { status: 500 }
    );
  }
}