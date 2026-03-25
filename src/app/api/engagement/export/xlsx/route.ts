// src/app/api/engagement/export/xlsx/route.ts
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
      .collection("engagements")
      .where("workspaceId", "==", workspaceId)
      .get();

    const rows = snap.docs.map((d) => {
      const item = d.data() as any;
      return {
        Nome: item.name || "",
        Usuario: item.username || "",
        SeguePerfil: item.isFollower ? "Sim" : "Não",
        TipoInteracao: item.interactionType || "",
        Sentimento: item.interactionSentiment || "",
        TextoInteracao: item.interactionText || "",
        Rede: item.network || "",
        Origem: item.source || "",
        PostTitulo: item.postTitle || "",
        PostTipo: item.postType || "",
        Tema: item.postTopic || "",
        Data: item.createdAt || "",
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Engajamentos");

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
          'attachment; filename="engajamentos.xlsx"',
      },
    });
  } catch (err) {
    console.error("[export xlsx] erro:", err);
    return NextResponse.json(
      { error: "Erro ao exportar XLSX." },
      { status: 500 },
    );
  }
}
