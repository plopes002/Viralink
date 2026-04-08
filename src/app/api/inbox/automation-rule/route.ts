// src/app/api/inbox/automation-rule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

const COLLECTION = "inboxAutomationRules";

const DEFAULT_RULE = {
  enabled: false,
  trigger: "new_message",
  matchType: "any",
  containsText: "",
  responseText: "",
  delaySeconds: 0,
  onlyFirstMessage: false,
  activeHoursOnly: false,
  templateKey: "",
  templateCategory: "geral",
};

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const socialAccountId = req.nextUrl.searchParams.get("socialAccountId");

    if (!workspaceId || !socialAccountId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId e socialAccountId são obrigatórios" },
        { status: 400 }
      );
    }

    const snap = await adminFirestore
      .collection(COLLECTION)
      .where("workspaceId", "==", workspaceId)
      .where("socialAccountId", "==", socialAccountId)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({
        ok: true,
        rule: DEFAULT_RULE,
      });
    }

    const doc = snap.docs[0];

    return NextResponse.json({
      ok: true,
      rule: {
        id: doc.id,
        ...DEFAULT_RULE,
        ...doc.data(),
      },
    });
  } catch (error: any) {
    console.error("[api/inbox/automation-rule][GET] error:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao carregar automação" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workspaceId = String(body?.workspaceId || "").trim();
    const socialAccountId = String(body?.socialAccountId || "").trim();
    const rule = body?.rule || {};

    if (!workspaceId || !socialAccountId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId e socialAccountId são obrigatórios" },
        { status: 400 }
      );
    }

    const normalizedRule = {
      workspaceId,
      socialAccountId,
      enabled: !!rule.enabled,
      trigger: "new_message",
      matchType: rule.matchType === "contains" ? "contains" : "any",
      containsText: String(rule.containsText || "").trim(),
      responseText: String(rule.responseText || "").trim(),
      delaySeconds: Number(rule.delaySeconds || 0),
      onlyFirstMessage: !!rule.onlyFirstMessage,
      activeHoursOnly: !!rule.activeHoursOnly,
      templateKey: String(rule.templateKey || "").trim(),
      templateCategory: String(rule.templateCategory || "geral").trim() || "geral",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const existing = await adminFirestore
      .collection(COLLECTION)
      .where("workspaceId", "==", workspaceId)
      .where("socialAccountId", "==", socialAccountId)
      .limit(1)
      .get();

    if (existing.empty) {
      const created = await adminFirestore.collection(COLLECTION).add({
        ...normalizedRule,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const createdSnap = await created.get();

      return NextResponse.json({
        ok: true,
        rule: {
          id: created.id,
          ...DEFAULT_RULE,
          ...createdSnap.data(),
        },
      });
    }

    const doc = existing.docs[0];

    await adminFirestore
      .collection(COLLECTION)
      .doc(doc.id)
      .update(normalizedRule);

    const updatedSnap = await adminFirestore
      .collection(COLLECTION)
      .doc(doc.id)
      .get();

    return NextResponse.json({
      ok: true,
      rule: {
        id: doc.id,
        ...DEFAULT_RULE,
        ...updatedSnap.data(),
      },
    });
  } catch (error: any) {
    console.error("[api/inbox/automation-rule][POST] error:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao salvar automação" },
      { status: 500 }
    );
  }
}
