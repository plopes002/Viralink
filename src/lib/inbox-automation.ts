// src/lib/inbox-automation.ts

type RunInboxAutomationParams = {
    workspaceId: string;
    socialAccountId: string;
    threadId: string;
    incomingText: string;
  };
  
  export async function runInboxAutomationForIncomingMessage(
    params: RunInboxAutomationParams
  ) {
    console.log("[inbox-automation] executando automação:", params);
  
    // 🚨 Stub temporário para não quebrar o build
    return {
      ok: true,
      executed: false,
      reason: "automation_not_implemented",
    };
  }