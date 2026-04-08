// src/lib/inbox-ingest.ts
import { adminFirestore } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

export type UpsertInboundInstagramMessageParams = {
  workspaceId: string;
  socialAccountId: string;
  platformThreadId: string;
  platformMessageId?: string | null;
  customerId: string;
  customerUsername?: string;
  customerName?: string;
  customerProfilePic?: string;
  text: string;
  sentAtMs?: number | null;
  raw?: any;
};

function asTimestampFromMs(ms?: number | null) {
  if (!ms || Number.isNaN(ms)) {
    return admin.firestore.FieldValue.serverTimestamp();
  }

  return admin.firestore.Timestamp.fromMillis(ms);
}

export async function findInboxThread(params: {
  workspaceId: string;
  socialAccountId: string;
  platformThreadId: string;
}) {
  const snap = await adminFirestore
    .collection("inboxThreads")
    .where("workspaceId", "==", params.workspaceId)
    .where("socialAccountId", "==", params.socialAccountId)
    .where("platformThreadId", "==", params.platformThreadId)
    .limit(1)
    .get();

  if (snap.empty) return null;

  return {
    id: snap.docs[0].id,
    ...snap.docs[0].data(),
  };
}

export async function findInboxMessageByPlatformId(params: {
  workspaceId: string;
  socialAccountId: string;
  platformMessageId: string;
}) {
  const snap = await adminFirestore
    .collection("inboxMessages")
    .where("workspaceId", "==", params.workspaceId)
    .where("socialAccountId", "==", params.socialAccountId)
    .where("platformMessageId", "==", params.platformMessageId)
    .limit(1)
    .get();

  if (snap.empty) return null;

  return {
    id: snap.docs[0].id,
    ...snap.docs[0].data(),
  };
}

export async function upsertInboundInstagramMessage(
  params: UpsertInboundInstagramMessageParams
) {
  if (params.platformMessageId) {
    const duplicated = await findInboxMessageByPlatformId({
      workspaceId: params.workspaceId,
      socialAccountId: params.socialAccountId,
      platformMessageId: params.platformMessageId,
    });

    if (duplicated) {
      return {
        ok: true,
        duplicated: true,
        threadId: duplicated.threadId,
        messageId: duplicated.id,
      };
    }
  }

  const sentAt = asTimestampFromMs(params.sentAtMs);
  const now = admin.firestore.FieldValue.serverTimestamp();

  const existingThread = await findInboxThread({
    workspaceId: params.workspaceId,
    socialAccountId: params.socialAccountId,
    platformThreadId: params.platformThreadId,
  });

  let threadId = existingThread?.id as string | undefined;

  if (!threadId) {
    const created = await adminFirestore.collection("inboxThreads").add({
      workspaceId: params.workspaceId,
      socialAccountId: params.socialAccountId,
      network: "instagram",
      platformThreadId: params.platformThreadId,
      customerId: params.customerId,
      customerUsername: params.customerUsername || "",
      customerName: params.customerName || "",
      customerProfilePic: params.customerProfilePic || "",
      lastMessageText: params.text,
      lastMessageAt: sentAt,
      lastMessageDirection: "inbound",
      unreadCount: 1,
      status: "open",
      automationEnabled: true,
      createdAt: now,
      updatedAt: now,
    });

    threadId = created.id;
  } else {
    const currentUnread = Number(existingThread?.unreadCount || 0);

    await adminFirestore.collection("inboxThreads").doc(threadId).update({
      customerId: params.customerId,
      customerUsername: params.customerUsername || "",
      customerName: params.customerName || "",
      customerProfilePic: params.customerProfilePic || "",
      lastMessageText: params.text,
      lastMessageAt: sentAt,
      lastMessageDirection: "inbound",
      unreadCount: currentUnread + 1,
      status: "open",
      updatedAt: now,
    });
  }

  const messageRef = await adminFirestore.collection("inboxMessages").add({
    workspaceId: params.workspaceId,
    threadId,
    socialAccountId: params.socialAccountId,
    network: "instagram",
    platformMessageId: params.platformMessageId || null,
    direction: "inbound",
    senderType: "customer",
    text: params.text,
    sentAt,
    deliveryStatus: "received",
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdAt: now,
    raw: params.raw || null,
  });

  return {
    ok: true,
    duplicated: false,
    threadId,
    messageId: messageRef.id,
  };
}
