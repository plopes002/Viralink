// src/app/api/engagement/analyze-sentiment/route.ts
import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { ai } from '@/ai/genkit';

function fallbackSentiment(text: string) {
  const t = text.toLowerCase();

  const positives = ["gostei", "ótimo", "excelente", "bom", "parabéns", "amei"];
  const negatives = ["ruim", "péssimo", "horrível", "não gostei", "fraco", "confuso"];

  if (positives.some((w) => t.includes(w))) return "positive";
  if (negatives.some((w) => t.includes(w))) return "negative";
  return "neutral";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body.text || "";

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Texto não informado." },
        { status: 400 },
      );
    }

    const prompt = `
Classifique o sentimento do texto abaixo em apenas UMA destas opções:
positive
neutral
negative

Regras:
- positive = elogio, aprovação, entusiasmo, satisfação
- neutral = dúvida, pergunta, observação neutra, intenção comercial sem emoção forte
- negative = crítica, reclamação, reprovação, frustração

Texto:
"${text}"

Responda apenas com uma palavra:
positive
neutral
negative
`.trim();

    const response = await ai.generate({
      prompt: prompt,
    });

    const raw =
      response.text
        ?.trim()
        .toLowerCase() || "";

    const sentiment =
      raw.includes("positive")
        ? "positive"
        : raw.includes("negative")
        ? "negative"
        : raw.includes("neutral")
        ? "neutral"
        : fallbackSentiment(text);

    return NextResponse.json({ sentiment });
  } catch (err) {
    console.error("[analyze-sentiment] erro:", err);
    return NextResponse.json(
      { sentiment: "neutral" },
      { status: 200 },
    );
  }
}
