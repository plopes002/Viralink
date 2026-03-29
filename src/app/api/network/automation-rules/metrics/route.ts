// src/app/api/network/automation-rules/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId obrigatório" },
        { status: 400 }
      );
    }

    const snap = await adminFirestore
      .collection("supporterInteractions")
      .where("workspaceId", "==", workspaceId)
      .get();

    const rulesMap: Record<string, any> = {};

    let totalExecutions = 0;
    let totalPublicReplies = 0;
    let totalPrivateReplies = 0;
    let totalLeads = 0;

    snap.docs.forEach((doc) => {
      const data = doc.data() as any;

      const ruleId = data.automationRuleId;
      const ruleName = data.automationRuleName;

      if (!ruleId) return;

      if (!rulesMap[ruleId]) {
        rulesMap[ruleId] = {
          ruleId,
          ruleName,
          executions: 0,
          publicReplies: 0,
          privateReplies: 0,
          leads: 0,
        };
      }

      rulesMap[ruleId].executions += 1;
      totalExecutions += 1;

      if (data.publicReplyMeta?.automated) {
        rulesMap[ruleId].publicReplies += 1;
        totalPublicReplies += 1;
      }

      if (data.privateReplyMeta?.automated) {
        rulesMap[ruleId].privateReplies += 1;
        totalPrivateReplies += 1;
      }

      if (data.status === "lead") {
        rulesMap[ruleId].leads += 1;
        totalLeads += 1;
      }
    });

    const metrics = Object.values(rulesMap)
      .map((m: any) => ({
        ...m,
        conversionRate: m.executions > 0 ? m.leads / m.executions : 0,
      }))
      .sort((a: any, b: any) => {
        if (b.leads !== a.leads) return b.leads - a.leads;
        return b.conversionRate - a.conversionRate;
      });

    const bestRuleByLeads = metrics.length > 0 ? metrics[0] : null;

    const bestRuleByConversion =
      metrics.length > 0
        ? [...metrics].sort(
            (a: any, b: any) => b.conversionRate - a.conversionRate
          )[0]
        : null;

    const summary = {
      totalExecutions,
      totalPublicReplies,
      totalPrivateReplies,
      totalLeads,
      averageConversionRate:
        totalExecutions > 0 ? totalLeads / totalExecutions : 0,
      bestRuleByLeads,
      bestRuleByConversion,
    };

    return NextResponse.json({
      ok: true,
      summary,
      metrics,
    });
  } catch (error: any) {
    console.error("[automation-metrics] erro:", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao carregar métricas." },
      { status: 500 }
    );
  }
}