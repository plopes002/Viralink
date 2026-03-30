// src/app/api/executivo/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const networkFilter = req.nextUrl.searchParams.get("network");

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId obrigatório" },
        { status: 400 }
      );
    }

    const interactionsSnap = await adminFirestore
      .collection("supporterInteractions")
      .where("workspaceId", "==", workspaceId)
      .get();

    let totalProfiles = 0;
    let hotLeads = 0;
    let priorityLeads = 0;
    let sentMessages = 0;
    let errorMessages = 0;

    let instagramCount = 0;
    let facebookCount = 0;

    interactionsSnap.docs.forEach((doc) => {
      const data = doc.data() as any;

      const network = String(
        data.network || data.source || data.platform || ""
      ).toLowerCase();

      if (networkFilter && networkFilter !== "all") {
        if (!network.includes(networkFilter)) return;
      }

      totalProfiles++;

      if (network.includes("instagram")) {
        instagramCount++;
      } else if (network.includes("facebook")) {
        facebookCount++;
      }

      if (data.intentLevel === "high") {
        hotLeads++;
      }

      if (data.status === "lead") {
        priorityLeads++;
      }

      if (data.privateReplyMeta?.automated) {
        sentMessages++;
      }

      if (data.automationLastError) {
        errorMessages++;
      }
    });

    const campaignsSnap = await adminFirestore
      .collection("campaigns")
      .where("workspaceId", "==", workspaceId)
      .get();

    const totalCampaigns = campaignsSnap.size;

    const queueSnap = await adminFirestore
      .collection("messageQueue")
      .where("workspaceId", "==", workspaceId)
      .get();

    let queuePending = 0;
    let queueProcessing = 0;
    let queueDone = 0;
    let queueErrors = 0;

    queueSnap.docs.forEach((doc) => {
      const data = doc.data() as any;

      if (data.status === "pending") {
        queuePending++;
      } else if (data.status === "processing") {
        queueProcessing++;
      } else if (data.status === "done") {
        queueDone++;
      } else if (data.status === "error") {
        queueErrors++;
      }
    });

    const totalMessages = totalProfiles;

    const errorRate =
      totalMessages > 0
        ? Number(((errorMessages / totalMessages) * 100).toFixed(1))
        : 0;

    const executiveScore = Math.max(
      0,
      Math.round(
        hotLeads * 2 +
          sentMessages * 0.5 -
          errorMessages * 2 -
          queueErrors * 3
      )
    );

    return NextResponse.json({
      ok: true,
      metrics: {
        totalProfiles,
        hotLeads,
        priorityLeads,
        totalCampaigns,

        sentMessages,
        queuedMessages: queuePending,
        processingMessages: queueProcessing,
        errorMessages,

        queuePending,
        queueProcessing,
        queueDone,
        queueErrors,

        queuedCampaigns: 0,
        processingCampaigns: 0,
        doneCampaigns: totalCampaigns,
        errorCampaigns: 0,

        totalMessages,
        errorRate,
        executiveScore,

        breakdown: {
          instagram: instagramCount,
          facebook: facebookCount,
        },
      },
    });
  } catch (error: any) {
    console.error("[executivo/metrics] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro interno" },
      { status: 500 }
    );
  }
}