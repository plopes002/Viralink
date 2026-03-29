// src/app/api/network/interactions/convert-to-lead/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { interactionId } = body;

    if (!interactionId) {
      return NextResponse.json(
        { ok: false, error: "interactionId é obrigatório." },
        { status: 400 }
      );
    }

    const interactionRef = adminFirestore
      .collection("supporterInteractions")
      .doc(interactionId);

    const interactionDoc = await interactionRef.get();

    if (!interactionDoc.exists) {
      return NextResponse.json(
        { ok: false, error: "Interação não encontrada." },
        { status: 404 }
      );
    }

    const interaction = interactionDoc.data() as any;

    const existingLead = await adminFirestore
      .collection("supporterLeads")
      .where("sourceInteractionId", "==", interactionId)
      .limit(1)
      .get();

    if (!existingLead.empty) {
      return NextResponse.json(
        { ok: false, error: "Essa interação já foi convertida em lead." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const leadRef = await adminFirestore.collection("supporterLeads").add({
      workspaceId: interaction.workspaceId,
      primaryAccountId: interaction.primaryAccountId,
      sourceCampaignAccountId: interaction.sourceCampaignAccountId,
      sourceInteractionId: interactionId,
      leadName: null,
      instagramUsername: interaction.commenterUsername || "",
      note: interaction.commenterText || "",
      status: "new",
      createdAt: now,
      updatedAt: now,
    });

    await interactionRef.update({
      status: "lead",
      updatedAt: now,
    });

    return NextResponse.json({
      ok: true,
      leadId: leadRef.id,
    });
  } catch (error: any) {
    console.error("[interactions/convert-to-lead] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao converter em lead." },
      { status: 500 }
    );
  }
}