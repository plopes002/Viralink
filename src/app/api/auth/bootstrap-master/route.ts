// src/app/api/auth/bootstrap-master/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-bootstrap-secret");

    if (!secret || secret !== process.env.BOOTSTRAP_MASTER_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Não autorizado." },
        { status: 401 }
      );
    }

    const email = process.env.MASTER_ADMIN_EMAIL;
    const password = process.env.MASTER_ADMIN_PASSWORD;
    const name = process.env.MASTER_ADMIN_NAME || "Master Admin";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Credenciais master não configuradas no .env.local." },
        { status: 500 }
      );
    }

    let userRecord;

    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch {
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
        disabled: false,
      });
    }

    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: "master_admin",
      isMasterAdmin: true,
    });

    await adminFirestore.collection("users").doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        name,
        email,
        role: "master_admin",
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      message: "Conta master criada/atualizada com sucesso.",
      uid: userRecord.uid,
      email,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao criar conta master.",
      },
      { status: 500 }
    );
  }
}
