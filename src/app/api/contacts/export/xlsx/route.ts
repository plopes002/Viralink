// src/app/api/contacts/export/xlsx/route.ts
import 'server-only';
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId é obrigatório." }, { status: 400 });
    }

    const snap = await adminFirestore
      .collection("contacts")
      .where("workspaceId", "==", workspaceId)
      .get();

    const rows = snap.docs.map((d) => {
      const item = d.data() as any;
      return {
        Nome: item.name || "",
        Usuario: item.username || "",
        Telefone: item.phone || "",
        Email: item.email || "",
        Rede: item.network || "",
        Score: item.leadScore || 0,
        Temperatura: item.leadTemperature || "",
        StatusContato: item.contactStatus || "",
        Origem: item.contactSource || "",
        Categorias: (item.categories || []).join(", "),
        TagsOperacionais: (item.operationalTags || []).join(", "),
        Observacoes: item.notes || "",
        PrimeiroContato: item.firstContactAt || "",
        UltimoContato: item.lastContactAt || "",
        UltimaInteracao: item.lastInteractionAt || "",
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contatos");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="contatos.xlsx"',
      },
    });
  } catch (err) {
    console.error("[contacts export xlsx] erro:", err);
    return NextResponse.json({ error: "Erro ao exportar contatos." }, { status: 500 });
  }
}
