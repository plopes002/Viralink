// src/app/api/engagement/political-review/route.ts
import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { politicalReviewFlow, PoliticalReviewOutput } from "@/ai/flows/political-review-flow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await politicalReviewFlow(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[political-review api] erro:", err);
    const fallback: PoliticalReviewOutput = {
      hasPoliticalMention: false,
      flags: [],
      entities: [],
      excerpt: "",
      summary: "Error during analysis.",
    };
    return NextResponse.json(fallback, { status: 500 });
  }
}
