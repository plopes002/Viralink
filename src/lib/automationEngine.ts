// src/lib/automationEngine.ts
import { collection, getDocs, query, where, Firestore } from "firebase/firestore";
import { importLeadToCRM } from "./importCompetitorLead";
import type { CompetitorLead } from "@/types/competitorLead";
import type { AutomationRule, CompetitorLeadAutomationRule } from "@/types/automation";

function matchConditions(conditions: CompetitorLeadAutomationRule['conditions'], lead: CompetitorLead): boolean {
  if (conditions.onlyNonFollowers && lead.isFollower) return false;
  if (conditions.onlyEngaged && !lead.hasInteracted) return false;
  if (conditions.sentiment && lead.sentiment !== conditions.sentiment) return false;
  if (conditions.interactionType && lead.interactionType !== conditions.interactionType) return false;
  return true;
}

function generateMessage(base: string, lead: CompetitorLead): string {
  let prefix = "";

  if (lead.interactionType === "comment") {
    prefix = "Vi que você comentou recentemente em um conteúdo 👀 ";
  } else if (lead.interactionType === "like") {
    prefix = "Vi que você curtiu um conteúdo recentemente 👍 ";
  } else if (lead.interactionType === "view") {
    prefix = "Notei que você visualizou um conteúdo recentemente 👀 ";
  } else if (lead.interactionType === "reaction") {
    prefix = "Vi que você reagiu a um conteúdo recentemente 👍 ";
  }

  return `${prefix}${base}`;
}

async function executeAction(firestore: Firestore, rule: CompetitorLeadAutomationRule, lead: CompetitorLead) {
  if (rule.action.type === "add_to_crm") {
    await importLeadToCRM(firestore, lead);
  }

  if (rule.action.type === "send_message" && rule.action.message) {
    const msg = generateMessage(rule.action.message, lead);
    console.log("Mensagem automática enviada (placeholder):", msg);
    // Future integration with messaging service goes here
  }
}

export async function processCompetitorLead(firestore: Firestore, lead: CompetitorLead) {
  const q = query(
    collection(firestore, "automations"),
    where("workspaceId", "==", lead.workspaceId),
    where("trigger", "==", "competitor_lead"),
    where("active", "==", true)
  );

  const snap = await getDocs(q);
  if (snap.empty) {
    return;
  }

  for (const doc of snap.docs) {
    const rule = { id: doc.id, ...doc.data() } as CompetitorLeadAutomationRule;

    if (matchConditions(rule.conditions, lead)) {
      await executeAction(firestore, rule, lead);
    }
  }
}
