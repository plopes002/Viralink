// src/app/api/instagram/insights/route.ts
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
    const socialAccountIdFromCampaign = primaryCampaign.socialAccountId || null;

    let socialAccountDoc:
      | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
      | FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
      | null = null;

    if (socialAccountIdFromCampaign) {
      const doc = await adminFirestore
        .collection("socialAccounts")
        .doc(socialAccountIdFromCampaign)
        .get();

      if (doc.exists) {
        socialAccountDoc = doc;
      }
    }

    if (!socialAccountDoc) {
      const fallbackSnap = await adminFirestore
        .collection("socialAccounts")
        .where("workspaceId", "==", workspaceId)
        .where("network", "==", "instagram")
        .where("isPrimary", "==", true)
        .limit(1)
        .get();

      if (fallbackSnap.empty) {
        return NextResponse.json(
          { ok: false, message: "Social account principal não encontrada" },
          { status: 404 }
        );
      }

      socialAccountDoc = fallbackSnap.docs[0];
    }

    if (!socialAccountDoc.exists) {
      return NextResponse.json(
        { ok: false, message: "Documento da social account não encontrado" },
        { status: 404 }
      );
    }

    const account = socialAccountDoc.data() as any;
    const resolvedSocialAccountId = socialAccountDoc.id;

    const instagramId = account.accountId;
    const accessToken = account.pageAccessToken || account.accessToken || "";

    if (!instagramId || !accessToken) {
      return NextResponse.json(
        { ok: false, message: "Conta principal sem accountId ou token" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(
        instagramId
      )}?fields=followers_count,media_count,username&access_token=${encodeURIComponent(
        accessToken
      )}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "Failed to fetch from Meta API");
    }

    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);

    const historyRef = adminFirestore
      .collection("instagramInsightsHistory")
      .doc(`${workspaceId}_${resolvedSocialAccountId}_${dateKey}`);

    await historyRef.set(
      {
        workspaceId,
        socialAccountId: resolvedSocialAccountId,
        accountId: instagramId,
        username: data.username || account.username || "",
        followersCount: data.followers_count || 0,
        mediaCount: data.media_count || 0,
        dateKey,
        capturedAt: now.toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      data: {
        ...data,
        socialAccountId: resolvedSocialAccountId,
      },
    });
  } catch (error) {
    console.error("[instagram/insights API]", error);
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}