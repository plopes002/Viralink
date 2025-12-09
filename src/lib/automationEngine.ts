// src/lib/automationEngine.ts
import { adminFirestore } from "@/lib/firebaseAdmin";
import type { InternalSocialEvent } from "@/types/internalSocialEvent";
import type { AutomationRule } from "@/types/automation";
import type { MessageTemplate } from "@/types/messageTemplate";
import { dispatchMessageForAutomation } from "@/lib/dispatcher";

export async function runAutomationsForEvent(event: InternalSocialEvent) {
  console.log("[runAutomationsForEvent] evento:", event.type, event.network);

  const automationsSnap = await adminFirestore
    .collection("automations")
    .where("workspaceId", "==", event.workspaceId)
    .where("socialAccountId", "==", event.socialAccountId)
    .where("network", "==", event.network)
    .where("active", "==", true)
    .get();

  if (automationsSnap.empty) {
    console.log("[runAutomationsForEvent] nenhuma automação encontrada.");
    return;
  }

  const automations: AutomationRule[] = automationsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));

  const matching = automations.filter((a) => matchAutomation(a, event));

  if (!matching.length) {
    console.log("[runAutomationsForEvent] nenhuma automação casou com o evento.");
    return;
  }

  console.log(
    `[runAutomationsForEvent] ${matching.length} automações serão processadas.`,
  );

  for (const automation of matching) {
    // MessageTemplate type is not defined, we will add it later.
    // const tplSnap = await adminFirestore
    //   .collection("messageTemplates")
    //   .doc(automation.messageTemplateId)
    //   .get();

    // if (!tplSnap.exists) {
    //   console.warn(
    //     `[runAutomationsForEvent] template ${automation.messageTemplateId} não encontrado.`,
    //   );
    //   continue;
    // }

    // const template = {
    //   id: tplSnap.id,
    //   ...(tplSnap.data() as any),
    // } as MessageTemplate;

    // await dispatchMessageForAutomation(automation, template, event);
  }
}

function matchAutomation(automation: AutomationRule, event: InternalSocialEvent): boolean {
    // 1) tipo do evento
    if (automation.triggerType !== event.type) {
        return false;
    }

    // 2) condição de palavra-chave (se houver)
    if (automation.conditions?.containsKeyword) {
        const kw = automation.conditions.containsKeyword.toLowerCase();
        const txt = (event.text || "").toLowerCase();
        if (!txt.includes(kw)) {
            return false;
        }
    }

    // 3) Outras condições (minFollowers, etc.) podem entrar aqui no futuro

    return true;
}
