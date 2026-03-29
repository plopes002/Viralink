// src/app/api/instagram/comments/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPrimaryInstagramSocialAccountByWorkspaceId } from "@/lib/primaryInstagramAccount";
import { syncInstagramCommentsForSocialAccount } from "@/lib/instagramCommentsSync";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId obrigatório." },
        { status: 400 }
      );
    }

    const social = await getPrimaryInstagramSocialAccountByWorkspaceId(
      workspaceId
    );

    const accessToken = social.pageAccessToken || social.accessToken || "";

    const result = await syncInstagramCommentsForSocialAccount({
      workspaceId,
      socialAccountId: social.id,
      accountId: social.accountId,
      accessToken,
      sourceRole: "primary",
      sourceCampaignAccountId: null,
      sourceName: social.name || "Conta principal",
      sourceUsername: social.username || "",
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[instagram/comments/sync] erro:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao sincronizar comentários." },
      { status: 500 }
    );
  }
}