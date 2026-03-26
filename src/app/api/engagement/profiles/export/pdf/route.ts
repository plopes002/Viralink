
import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { EngagementProfile } from "@/types/engagementProfile";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId é obrigatório." },
        { status: 400 },
      );
    }

    const snap = await adminFirestore
      .collection("engagementProfiles")
      .where("workspaceId", "==", workspaceId)
      .orderBy("leadScore", "desc")
      .get();

    const items = snap.docs.map((d) => d.data() as EngagementProfile);

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 800;

    page.drawText("Relatório de Perfis Consolidados - VIRALINK", {
      x: 40,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    y -= 30;

    for (const item of items.slice(0, 35)) {
      const line = `(${item.leadScore}) ${item.name} (@${item.username}) - ${item.leadTemperature}`;

      page.drawText(line.slice(0, 100), {
        x: 40,
        y,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      y -= 18;

      if (y < 60) break;
    }

    const bytes = await pdf.save();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="perfis_consolidados.pdf"',
      },
    });
  } catch (err) {
    console.error("[export profiles pdf] erro:", err);
    return NextResponse.json(
      { error: "Erro ao exportar PDF." },
      { status: 500 },
    );
  }
}
