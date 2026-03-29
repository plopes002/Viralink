// src/lib/automationEngine.ts

import {
  collection,
  getDocs,
  query,
  where,
  Firestore,
} from "firebase/firestore";

import { importLeadToCRM } from "./importCompetitorLead";

import type { CompetitorLead } from "@/types/competitorLead";
import type {
  AutomationRule,
  CompetitorLeadAutomationRule,
} from "@/types/automation";

/**
 * Verifica se o lead atende às condições da automação
 */
function matchConditions(
  conditions: CompetitorLeadAutomationRule["conditions"],
  lead: CompetitorLead
): boolean {
  if (conditions.onlyNonFollowers && lead.isFollower) return false;
  if (conditions.onlyEngaged && !lead.hasInteracted) return false;
  if (conditions.sentiment && lead.sentiment !== conditions.sentiment)
    return false;
  if (
    conditions.interactionType &&
    lead.interactionType !== conditions.interactionType
  )
    return false;

  return true;
}

/**
 * Gera mensagem personalizada com base na interação do lead
 */
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

/**
 * Executa a ação configurada na automação
 */
async function executeAction(
  firestore: Firestore,
  rule: CompetitorLeadAutomationRule,
  lead: CompetitorLead
) {
  // 👉 Adicionar ao CRM
  if (rule.action.type === "add_to_crm") {
    await importLeadToCRM(firestore, lead);
  }

  // 👉 Enviar mensagem (placeholder por enquanto)
  if (rule.action.type === "send_message" && rule.action.message) {
    const msg = generateMessage(rule.action.message, lead);

    console.log("Mensagem automática enviada (placeholder):", msg);

    // 🔥 FUTURO:
    // integrar com Instagram / WhatsApp / Messenger
  }
}

/**
 * Processa automações para leads de concorrente
 */
export async function processCompetitorLead(
  firestore: Firestore,
  lead: CompetitorLead
) {
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
    const rule = {
      id: doc.id,
      ...doc.data(),
    } as CompetitorLeadAutomationRule;

    if (matchConditions(rule.conditions, lead)) {
      await executeAction(firestore, rule, lead);
    }
  }
}

/**
 * 🔥 FUNÇÃO GENÉRICA (RESOLVE SEU ERRO DE BUILD)
 * Permite disparar automações baseado em eventos
 */
export async function runAutomationsForEvent(
  firestore: Firestore,
  event: {
    type: string;
    data: any;
  }
) {
  if (!event?.type) {
    console.warn("Evento inválido recebido:", event);
    return;
  }

  switch (event.type) {
    case "competitor_lead":
      if (event.data) {
        return processCompetitorLead(firestore, event.data);
      }
      break;

    default:
      console.warn("Evento não suportado:", event.type);
  }
}