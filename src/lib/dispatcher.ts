// src/lib/dispatcher.ts
import { adminFirestore } from "@/lib/firebaseAdmin";
import type { AutomationRule } from "@/types/automation";
import type { MessageTemplate } from "@/types/messageTemplate";
import type { InternalSocialEvent } from "@/types/internalSocialEvent";

export async function dispatchMessageForAutomation(
  automation: AutomationRule,
  template: MessageTemplate,
  event: InternalSocialEvent,
) {
  const accSnap = await adminFirestore
    .collection("socialAccounts")
    .doc(automation.socialAccountId)
    .get();

  if (!accSnap.exists) {
    console.warn(
      `[dispatchMessageForAutomation] socialAccount ${automation.socialAccountId} não encontrada.`,
    );
    return;
  }

  const account = accSnap.data() as any;

  let content = template.content;

  content = content
    .replace(/\{\{nome\}\}/gi, event.fromUser.name || "")
    .replace(/\{\{usuario\}\}/gi, event.fromUser.username || "");

  if (automation.actionChannel === "instagram_dm") {
    await sendInstagramDM(account, event.fromUser.externalId, content);
  } else {
    console.log(
      "[dispatchMessageForAutomation] canal ainda não implementado:",
      automation.actionChannel,
    );
  }

  await adminFirestore.collection("automationLogs").add({
    workspaceId: automation.workspaceId,
    automationId: automation.id,
    messageTemplateId: template.id,
    socialAccountId: automation.socialAccountId,
    eventType: event.type,
    toUser: event.fromUser,
    content,
    sentAt: new Date().toISOString(),
  });
}

async function sendInstagramDM(
  account: any,
  toUserId: string,
  content: string,
) {
  const accessToken = account.accessToken;
  const igBusinessId = account.igBusinessId;

  if (!accessToken || !igBusinessId) {
    console.error("[sendInstagramDM] falta accessToken ou igBusinessId na conta.");
    return;
  }

  console.log(
    `[sendInstagramDM] (placeholder) DM para ${toUserId}: ${content.slice(
      0,
      80,
    )}...`,
  );

  // Aqui entra a chamada real à API do Meta.
  // Quando você estiver com o app Meta configurado, trocamos esse console.log
  // por um fetch/axios pro endpoint oficial.
}
