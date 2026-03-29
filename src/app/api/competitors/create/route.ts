// src/app/api/competitors/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

function normalizeUsername(value: string) {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      workspaceId,
      ownerUserId,
      username,
      name,
      notes,
    } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId é obrigatório." },
        { status: 400 }
      );
    }

    const normalizedUsername = normalizeUsername(username);

    if (!normalizedUsername) {
      return NextResponse.json(
        { ok: false, error: "username é obrigatório." },
        { status: 400 }
      );
    }

    const existingSnap = await adminFirestore
      .collection("competitorAccounts")
      .where("workspaceId", "==", workspaceId)
      .where("network", "==", "instagram")
      .where("username", "==", normalizedUsername)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json(
        { ok: false, error: "Esse concorrente já está cadastrado." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const ref = await adminFirestore.collection("competitorAccounts").add({
      workspaceId,
      ownerUserId: ownerUserId || null,
      network: "instagram",
      username: normalizedUsername,
      name: name?.trim() || null,
      instagramAccountId: null,
      profilePictureUrl: null,
      source: "manual",
      status: "active",
      notes: notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      ok: true,
      competitorId: ref.id,
    });
  } catch (error: any) {
    console.error("[competitors/create] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao criar concorrente." },
      { status: 500 }
    );
  }
}