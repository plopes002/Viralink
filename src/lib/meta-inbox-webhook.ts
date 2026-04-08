// src/lib/meta-inbox-webhook.ts
import { adminFirestore } from "@/lib/firebaseAdmin";
import { upsertInboundInstagramMessage } from "@/lib/inbox-ingest";

type ResolvedSocialAccount = {
  id: string;
  workspaceId: string;
  accountId?: string;
  instagramId?: string;
  instagramUserId?: string;
  pageId?: string;
  facebookPageId?: string;
  username?: string;
  name?: string;
  [key: string]: any;
};

type ParsedInboundEvent = {
  recipientPlatformId: string;
  senderPlatformId: string;
  platformMessageId: string | null;
  text: string;
  sentAtMs: number | null;
  raw: any;
};

function getString(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueStrings(values: any[]) {
  return [...new Set(values.map((v) => getString(v)).filter(Boolean))];
}

async function findSocialAccountByRecipientId(
  recipientPlatformId: string
): Promise<ResolvedSocialAccount | null> {
  const candidateFields = [
    "accountId",
    "instagramId",
    "instagramUserId",
    "pageId",
    "facebookPageId",
  ];

  for (const field of candidateFields) {
    const snap = await adminFirestore
      .collection("socialAccounts")
      .where("network", "==", "instagram")
      .where(field, "==", recipientPlatformId)
      .limit(1)
      .get();

    if (!snap.empty) {
      return {
        id: snap.docs[0].id,
        ...(snap.docs[0].data() as any),
      };
    }
  }

  return null;
}

function parseMessagingArray(entry: any): ParsedInboundEvent[] {
  const messaging = Array.isArray(entry?.messaging) ? entry.messaging : [];

  return messaging
    .map((item: any) => {
      const senderId = getString(item?.sender?.id);
      const recipientId = getString(item?.recipient?.id);
      const mid = getString(item?.message?.mid) || null;
      const text = getString(item?.message?.text);
      const timestamp =
        typeof item?.timestamp === "number" ? item.timestamp : null;

      if (!senderId || !recipientId || !text) {
        return null;
      }

      return {
        recipientPlatformId: recipientId,
        senderPlatformId: senderId,
        platformMessageId: mid,
        text,
        sentAtMs: timestamp,
        raw: item,
      };
    })
    .filter(Boolean) as ParsedInboundEvent[];
}

function parseChangesArray(entry: any): ParsedInboundEvent[] {
  const changes = Array.isArray(entry?.changes) ? entry.changes : [];

  const parsed: ParsedInboundEvent[] = [];

  for (const change of changes) {
    const value = change?.value || {};

    const messages = Array.isArray(value?.messages) ? value.messages : [];
    const contacts = Array.isArray(value?.contacts) ? value.contacts : [];
    const metadata = value?.metadata || {};

    const recipientCandidates = uniqueStrings([
      metadata?.phone_number_id,
      metadata?.display_phone_number,
      value?.recipient?.id,
      entry?.id,
    ]);

    const fallbackRecipient = recipientCandidates[0] || "";
    const fallbackSender =
      getString(contacts?.[0]?.wa_id) ||
      getString(contacts?.[0]?.id) ||
      getString(value?.from);

    for (const item of messages) {
      const text =
        getString(item?.text?.body) ||
        getString(item?.message?.text) ||
        getString(item?.text);

      const senderId = getString(item?.from) || fallbackSender;
      const recipientId = fallbackRecipient;
      const mid = getString(item?.id) || null;
      const timestampSeconds = Number(item?.timestamp || 0);
      const timestampMs = timestampSeconds ? timestampSeconds * 1000 : null;

      if (!senderId || !recipientId || !text) continue;

      parsed.push({
        recipientPlatformId: recipientId,
        senderPlatformId: senderId,
        platformMessageId: mid,
        text,
        sentAtMs: timestampMs,
        raw: { change, message: item },
      });
    }
  }

  return parsed;
}

export function parseInstagramInboundWebhookEvents(payload: any) {
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  const parsed: ParsedInboundEvent[] = [];

  for (const entry of entries) {
    parsed.push(...parseMessagingArray(entry));
    parsed.push(...parseChangesArray(entry));
  }

  return parsed;
}

export async function ingestInstagramWebhookPayload(payload: any) {
  const events = parseInstagramInboundWebhookEvents(payload);

  const results = [];

  for (const event of events) {
    const socialAccount = await findSocialAccountByRecipientId(
      event.recipientPlatformId
    );

    if (!socialAccount?.workspaceId) {
      results.push({
        ok: false,
        reason: "social_account_not_found",
        recipientPlatformId: event.recipientPlatformId,
        raw: event.raw,
      });
      continue;
    }

    const threadKey = `${event.senderPlatformId}:${event.recipientPlatformId}`;

    const result = await upsertInboundInstagramMessage({
      workspaceId: socialAccount.workspaceId,
      socialAccountId: socialAccount.id,
      platformThreadId: threadKey,
      platformMessageId: event.platformMessageId,
      customerId: event.senderPlatformId,
      customerUsername: "",
      customerName: "",
      customerProfilePic: "",
      text: event.text,
      sentAtMs: event.sentAtMs,
      raw: event.raw,
    });

    results.push({
      ok: true,
      workspaceId: socialAccount.workspaceId,
      socialAccountId: socialAccount.id,
      threadId: result.threadId,
      messageId: result.messageId,
      duplicated: result.duplicated,
    });
  }

  return {
    ok: true,
    processed: events.length,
    results,
  };
}
