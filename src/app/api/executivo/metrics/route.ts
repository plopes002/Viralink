// src/app/api/executivo/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId obrigatório" },
        { status: 400 }
      );
    }

    // 🔹 INTERAÇÕES
    const interactionsSnap = await adminFirestore
      .collection("supporterInteractions")
      .where("workspaceId", "==", workspaceId)
      .get();

    let totalProfiles = 0;
    let hotLeads = 0;
    let priorityLeads = 0;
    let sentMessages = 0;
    let errorMessages = 0;

    interactionsSnap.docs.forEach((doc) => {
      const data = doc.data() as any;

      totalProfiles++;

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

    // 🔹 CAMPANHAS
    const campaignsSnap = await adminFirestore
      .collection("campaigns")
      .where("workspaceId", "==", workspaceId)
      .get();

    let totalCampaigns = campaignsSnap.size;

    // 🔹 FILA (simples por enquanto)
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

      if (data.status === "pending") queuePending++;
      else if (data.status === "processing") queueProcessing++;
      else if (data.status === "done") queueDone++;
      else if (data.status === "error") queueErrors++;
    });

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

        totalMessages: totalProfiles,
        errorRate:
          totalProfiles > 0
            ? ((errorMessages / totalProfiles) * 100).toFixed(1)
            : 0,
      },
    });
  } catch (error: any) {
    console.error("[executivo/metrics] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message },
      { status: 500 }
    );
  }
}