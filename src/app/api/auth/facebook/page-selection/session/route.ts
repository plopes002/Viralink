// src/app/api/auth/facebook/page-selection/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session");

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "Sessão não informada." },
        { status: 400 }
      );
    }

    const doc = await adminFirestore.collection("facebookPageSelections").doc(sessionId).get();

    if (!doc.exists) {
      return NextResponse.json({ ok: false, error: "Sessão não encontrada." }, { status: 404 });
    }

    const data = doc.data() as any;

    if (data.status !== "pending") {
      return NextResponse.json({ ok: false, error: "Sessão inválida ou já utilizada." }, { status: 400 });
    }

    if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      session: {
        id: doc.id,
        mode: data.mode,
        pages: (data.pages || []).map((p: any) => ({
          id: p.id,
          name: p.name,
        })),
      },
    });
  } catch (error: any) {
    console.error("[facebook/page-selection/session] erro:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Erro ao carregar sessão." }, { status: 500 });
  }
}
