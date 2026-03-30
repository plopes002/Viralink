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

    const sessionRef = adminFirestore.collection("facebookPageSelections").doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      return NextResponse.json({ ok: false, error: "Sessão não encontrada." }, { status: 404 });
    }

    const session = sessionSnap.data() as any;

    if (session.status !== "pending") {
      return NextResponse.json({ ok: false, error: "Sessão inválida ou já utilizada." }, { status: 400 });
    }

    const selectedPage = (session.pages || []).find((p: any) => p.id === pageId);
    if (!selectedPage) {
      return NextResponse.json({ ok: false, error: "Página não encontrada na sessão." }, { status: 404 });
    }

    const now = new Date().toISOString();
    
    // Upsert Facebook Social Account
    const socialAccountQuery = await adminFirestore.collection("socialAccounts").where("workspaceId", "==", session.workspaceId).where("network", "==", "facebook").where("accountId", "==", selectedPage.id).limit(1).get();

    const socialPayload: any = {
      workspaceId: session.workspaceId,
      ownerUserId: session.ownerUserId,
      network: "facebook",
      accountType: "page",
      accountId: selectedPage.id,
      facebookPageId: selectedPage.id,
      facebookPageName: selectedPage.name,
      name: selectedPage.name,
      status: "connected",
      accessToken: session.userAccessToken,
      pageAccessToken: selectedPage.access_token,
      updatedAt: now,
    };
    
    if (session.mode === 'primary') {
        const primaryQuery = await adminFirestore.collection("socialAccounts").where("workspaceId", "==", session.workspaceId).where("isPrimary", "==", true).where("network", "==", "facebook").limit(1).get();
        if (primaryQuery.empty) {
            socialPayload.isPrimary = true;
        }
    }

    let socialAccountId: string;
    if (socialAccountQuery.empty) {
      socialPayload.createdAt = now;
      const docRef = await adminFirestore.collection("socialAccounts").add(socialPayload);
      socialAccountId = docRef.id;
    } else {
      const docRef = socialAccountQuery.docs[0].ref;
      await docRef.update(socialPayload);
      socialAccountId = docRef.id;
    }
    
    // Upsert Instagram Social Account
    if (selectedPage.instagram_business_account?.id) {
        const igId = selectedPage.instagram_business_account.id;
        // The instagram data should already be in the session's page object
        const igData = selectedPage.instagram_business_account;
        const pageName = selectedPage.name || "";
        const igUsername = igData.username || "";

        const igQuery = await adminFirestore.collection("socialAccounts").where("workspaceId", "==", session.workspaceId).where("network", "==", "instagram").where("accountId", "==", igId).limit(1).get();
        
        const igPayload: any = {
          workspaceId: session.workspaceId,
          ownerUserId: session.ownerUserId,
          network: "instagram",
          accountId: igId,
          username: igUsername,
          name: igData.name || igUsername || pageName || "Instagram", // Fallback logic
          followers: igData.followers_count || 0,
          accessToken: selectedPage.access_token,
          pageAccessToken: selectedPage.access_token,
          facebookPageId: selectedPage.id,
          facebookPageName: pageName,
          status: "connected",
          updatedAt: now,
        };

        if (session.mode === 'primary') {
            const primaryIgQuery = await adminFirestore.collection("socialAccounts").where("workspaceId", "==", session.workspaceId).where("isPrimary", "==", true).where("network", "==", "instagram").limit(1).get();
            if (primaryIgQuery.empty) {
                igPayload.isPrimary = true;
            }
        }
        
        let igSocialAccountId: string;
        if (igQuery.empty) {
            igPayload.createdAt = now;
            const docRef = await adminFirestore.collection("socialAccounts").add(igPayload);
            igSocialAccountId = docRef.id;
        } else {
            const docRef = igQuery.docs[0].ref;
            await docRef.update(igPayload);
            igSocialAccountId = docRef.id;
        }

        // Upsert CampaignAccount for Instagram
        const igCampaignQuery = await adminFirestore
          .collection("campaignAccounts")
          .where("workspaceId", "==", session.workspaceId)
          .where("accountId", "==", igId)
          .limit(1)
          .get();
          
        const igCampaignPayload = {
          workspaceId: session.workspaceId,
          role: session.mode,
          socialAccountId: igSocialAccountId,
          name: igData.name || igUsername,
          username: igUsername,
          network: "instagram",
          accountId: igId,
          status: "connected",
          ownerUserId: session.ownerUserId,
          updatedAt: now,
        };
        
        if (igCampaignQuery.empty) {
          await adminFirestore.collection("campaignAccounts").add({ ...igCampaignPayload, createdAt: now });
        } else {
          await igCampaignQuery.docs[0].ref.update(igCampaignPayload);
        }
    }

    // Link Facebook Campaign Account
    const campaignQuery = await adminFirestore.collection("campaignAccounts")
      .where("workspaceId", "==", session.workspaceId)
      .where("accountId", "==", selectedPage.id)
      .limit(1)
      .get();
      
    const campaignPayload = {
      workspaceId: session.workspaceId,
      role: session.mode,
      socialAccountId,
      name: selectedPage.name,
      network: "facebook",
      accountId: selectedPage.id,
      status: "connected",
      ownerUserId: session.ownerUserId,
      updatedAt: now,
    };
      
    if (campaignQuery.empty) {
      await adminFirestore.collection("campaignAccounts").add({...campaignPayload, createdAt: now});
    } else {
      await campaignQuery.docs[0].ref.update(campaignPayload);
    }
    
    // Finalize session
    await sessionRef.update({ status: "completed", selectedPageId: pageId, completedAt: now, updatedAt: now });

    const redirectPath = session.mode === 'supporter' ? '/supporters?status=success' : '/social-accounts?status=success';
    
    return NextResponse.json({
      ok: true,
      redirectTo: `${APP_URL}${redirectPath}`,
    });
  } catch (error: any) {
    console.error("[facebook/page-selection/confirm] erro:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Erro ao confirmar página." }, { status: 500 });
  }
}
