// src/app/api/engagement/profiles/export/xlsx/route.ts
import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import * as XLSX from "xlsx";

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
      .get();

    const rows = snap.docs.map((d) => {
      const item = d.data() as any;
      return {
        Nome: item.name || "",
        Usuario: item.username || "",
        SeguePerfil: item.isFollower ? "Sim" : "Não",
        Score: item.leadScore || 0,
        Temperatura: item.leadTemperature || "",
        Interacoes: item.totalInteractions || 0,
        Comentarios: item.totalComments || 0,
        Mensagens: item.totalMessages || 0,
        Telefone: item.phone || "",
        Email: item.email || "",
        Categorias: (item.categories || []).join(", "),
        TagsOperacionais: (item.operationalTags || []).join(", "),
        EntidadesPoliticas: (item.politicalEntities || []).join(", "),
        UltimaInteracao: item.lastInteractionAt || "",
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Perfis");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="perfis-consolidados.xlsx"',
      },
    });
  } catch (err) {
    console.error("[export profiles xlsx] erro:", err);
    return NextResponse.json(
      { error: "Erro ao exportar XLSX." },
      { status: 500 },
    );
  }
}
