import { NextRequest, NextResponse } from "next/server";
import { generateCompetitorStrategy } from "@/ai/flows/generate-competitor-strategy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { myAccount, competitor, periodDays, variations } = body || {};

    if (!myAccount || !competitor) {
      return NextResponse.json(
        { error: "myAccount e competitor são obrigatórios." },
        { status: 400 }
      );
    }
    
    const result = await generateCompetitorStrategy({
        myAccount,
        competitor,
        periodDays,
        variations,
    });

    return NextResponse.json(result);

  } catch (err) {
    console.error("[generate competitor strategy] erro:", err);
    return NextResponse.json(
      { error: "Erro ao gerar análise estratégica." },
      { status: 500 }
    );
  }
}