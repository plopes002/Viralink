
import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import * as XLSX from "xlsx";
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
      .get();

    const rows = snap.docs.map((d) => {
      const item = d.data() as EngagementProfile;
      return {
        Nome: item.name || "",
        Usuario: item.username || "",
        Segue: item.isFollower ? "Sim" : "Não",
        Rede: item.network || "",
        Telefone: item.phone || "",
        Email: item.email || "",
        Score: item.leadScore || 0,
        Temperatura: item.leadTemperature || "cold",
        'Total Interações': item.totalInteractions,
        'Total Comentários': item.totalComments,
        'Total Mensagens': item.totalMessages,
        Categorias: (item.categories || []).join(", "),
        'Tags Operacionais': (item.operationalTags || []).join(", "),
        'Entidades Políticas': (item.politicalEntities || []).join(", "),
        'Primeira Interação': item.firstInteractionAt || "",
        'Última Interação': item.lastInteractionAt || "",
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Perfis Consolidados");

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
          'attachment; filename="perfis_consolidados.xlsx"',
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
