// src/app/api/campaigns/generate-template/route.ts
import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { generateCampaignTemplate } from "@/ai/flows/generate-campaign-template";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await generateCampaignTemplate(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[generate-template api] erro:", err);
    return NextResponse.json(
      { error: "Erro ao gerar template com IA." },
      { status: 500 },
    );
  }
}
