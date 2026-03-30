// src/app/api/network/supporter-invites/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminFirestore } from "@/lib/firebaseAdmin";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://viramind.site";

type InviteNetwork = "instagram" | "facebook";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const workspaceId = body.workspaceId;
    const primaryAccountId = body.primaryAccountId;
    const invitedByUserId = body.invitedByUserId;
    const supporterName = body.supporterName || null;
    const network: InviteNetwork =
      body.network === "facebook" ? "facebook" : "instagram";

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId é obrigatório." },
        { status: 400 }
      );
    }

    if (!primaryAccountId) {
      return NextResponse.json(
        { ok: false, error: "primaryAccountId é obrigatório." },
        { status: 400 }
      );
    }

    if (!invitedByUserId) {
      return NextResponse.json(
        { ok: false, error: "invitedByUserId é obrigatório." },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(20).toString("hex");

    await adminFirestore.collection("supporterInvites").doc(token).set({
      token,
      workspaceId,
      primaryAccountId,
      invitedByUserId,
      supporterName,
      network,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const link = `/supporters/connect?token=${token}`;
    const absoluteLink = `${APP_URL}${link}`;

    return NextResponse.json({
      ok: true,
      token,
      link,
      absoluteLink,
      network,
    });
  } catch (error) {
    console.error("[supporter-invites/create] erro:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Erro ao criar convite.",
      },
      { status: 500 }
    );
  }
}