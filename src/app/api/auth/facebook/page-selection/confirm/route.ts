// src/app/api/auth/facebook/page-selection/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://viramind.site";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = body.sessionId;
    const pageId = body.pageId;

    if (!sessionId || !pageId) {
      return NextResponse.json(
        { ok: false, error: "sessionId e pageId são obrigatórios." },
        { status: 400 }
      );
    }

    const sessionRef = adminFirestore
      .collection("facebookPageSelections")
      .doc(sessionId);

    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      return NextResponse.json(
        { ok: false, error: "Sessão não encontrada." },
        { status: 404 }
      );
    }

    const session = sessionSnap.data() as any;

    if (session.status !== "pending") {
      return NextResponse.json(
        { ok: false, error: "Sessão inválida ou já utilizada." },
        { status: 400 }
      );
    }

    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, error: "Sessão expirada." },
        { status: 400 }
      );
    }

    const selectedPage = (session.pages || []).find((p: any) => p.id === pageId);

    if (!selectedPage) {
      return NextResponse.json(
        { ok: false, error: "Página não encontrada na sessão." },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    const socialAccountQuery = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", session.workspaceId)
      .where("network", "==", "facebook")
      .where("accountId", "==", selectedPage.id)
      .limit(1)
      .get();

    const primarySocialQuery = await adminFirestore
      .collection("socialAccounts")
      .where("workspaceId", "==", session.workspaceId)
      .where("network", "==", "facebook")
      .where("isPrimary", "==", true)
      .limit(1)
      .get();

    const isPrimary =
      session.mode === "primary" &&
      primarySocialQuery.empty &&
      socialAccountQuery.empty;

    const socialPayload = {
      workspaceId: session.workspaceId,
      ownerUserId: session.ownerUserId,
      network: "facebook" as const,
      accountType: "page" as const,
      accountId: selectedPage.id,
      username: "",
      name: selectedPage.name || "Página Facebook",
      status: "connected" as const,
      followers: 0,
      isPrimary,
      accessToken: selectedPage.access_token || session.userAccessToken,
      pageAccessToken: selectedPage.access_token || null,
      facebookPageId: selectedPage.id,
      facebookPageName: selectedPage.name || null,
      updatedAt: now,
    };

    let socialAccountId: string;

    if (socialAccountQuery.empty) {
      const createdRef = await adminFirestore.collection("socialAccounts").add({
        ...socialPayload,
        createdAt: now,
      });
      socialAccountId = createdRef.id;
    } else {
      const docRef = socialAccountQuery.docs[0].ref;
      await docRef.update(socialPayload);
      socialAccountId = docRef.id;
    }

    if (session.mode === "primary") {
      const campaignQuery = await adminFirestore
        .collection("campaignAccounts")
        .where("workspaceId", "==", session.workspaceId)
        .where("role", "==", "primary")
        .where("network", "==", "facebook")
        .limit(1)
        .get();

      const campaignPayload = {
        workspaceId: session.workspaceId,
        role: "primary" as const,
        linkedToAccountId: null,
        socialAccountId,
        name: selectedPage.name || "Página principal",
        username: "",
        network: "facebook" as const,
        accountType: "page" as const,
        accountId: selectedPage.id,
        status: "connected" as const,
        ownerUserId: session.ownerUserId,
        permissions: null,
        updatedAt: now,
      };

      if (campaignQuery.empty) {
        await adminFirestore.collection("campaignAccounts").add({
          ...campaignPayload,
          createdAt: now,
        });
      } else {
        await campaignQuery.docs[0].ref.set(campaignPayload, { merge: true });
      }

      await sessionRef.update({
        status: "completed",
        selectedPageId: selectedPage.id,
        completedAt: now,
        updatedAt: now,
      });

      return NextResponse.json({
        ok: true,
        redirectTo: `${APP_URL}/social-accounts?status=success_facebook_page_primary`,
      });
    }

    if (!session.token) {
      return NextResponse.json(
        { ok: false, error: "Token do convite não encontrado." },
        { status: 400 }
      );
    }

    const inviteSnap = await adminFirestore
      .collection("supporterInvites")
      .where("token", "==", session.token)
      .limit(1)
      .get();

    if (inviteSnap.empty) {
      return NextResponse.json(
        { ok: false, error: "Convite de apoiador não encontrado." },
        { status: 404 }
      );
    }

    const inviteDoc = inviteSnap.docs[0];
    const invite = inviteDoc.data() as any;

    const existingSupporterQuery = await adminFirestore
      .collection("campaignAccounts")
      .where("workspaceId", "==", invite.workspaceId)
      .where("role", "==", "supporter")
      .where("ownerUserId", "==", session.ownerUserId)
      .where("linkedToAccountId", "==", invite.primaryAccountId)
      .where("network", "==", "facebook")
      .limit(1)
      .get();

    const supporterPayload = {
      workspaceId: invite.workspaceId,
      role: "supporter" as const,
      linkedToAccountId: invite.primaryAccountId,
      socialAccountId,
      name: selectedPage.name || "Apoiador Facebook",
      username: "",
      network: "facebook" as const,
      accountType: "page" as const,
      accountId: selectedPage.id,
      status: "connected" as const,
      ownerUserId: session.ownerUserId,
      permissions: {
        allowContentBoost: true,
        allowLeadCapture: false,
        allowFollowerCampaigns: true,
      },
      updatedAt: now,
    };

    if (existingSupporterQuery.empty) {
      await adminFirestore.collection("campaignAccounts").add({
        ...supporterPayload,
        createdAt: now,
      });
    } else {
      await existingSupporterQuery.docs[0].ref.update(supporterPayload);
    }

    await inviteDoc.ref.update({
      status: "accepted",
      acceptedAt: now,
    });

    await sessionRef.update({
      status: "completed",
      selectedPageId: selectedPage.id,
      completedAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      ok: true,
      redirectTo: `${APP_URL}/supporters?status=success_facebook_page_supporter`,
    });
  } catch (error: any) {
    console.error("[facebook/page-selection/confirm] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao confirmar página." },
      { status: 500 }
    );
  }
}