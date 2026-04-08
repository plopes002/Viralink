// src/lib/inbox.ts
import { adminFirestore } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

type ThreadDoc = {
  workspaceId: string;
  socialAccountId: string;
  network: "instagram";
  platformThreadId: string;
  customerId?: string;
  customerUsername?: string;
  customerName?: string;
  customerProfilePic?: string;
  lastMessageText?: string;
  lastMessageAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
  lastMessageDirection?: "inbound" | "outbound";
  unreadCount?: number;
  status?: "open" | "pending" | "closed" | "archived";
  automationEnabled?: boolean;
  createdAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
  updatedAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
};

type MessageDoc = {
  workspaceId: string;
  threadId: string;
  socialAccountId: string;
  network: "instagram";
  platformMessageId?: string | null;
  direction: "inbound" | "outbound";
  senderType: "customer" | "agent" | "automation" | "system";
  text: string;
  sentAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
  deliveryStatus?: string;
  isDeleted?: boolean;
  deletedAt?: FirebaseFirestore.Timestamp | null;
  deletedBy?: string | null;
  createdAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
  raw?: any;
};

export async function getInboxThreadById(threadId: string) {
  const ref = adminFirestore.collection("inboxThreads").doc(threadId);
  const snap = await ref.get();

  if (!snap.exists) return null;

  return {
    id: snap.id,
    ...snap.data(),
  } as any;
}

export async function assertThreadBelongsToWorkspace(threadId: string, workspaceId: string) {
  const thread = await getInboxThreadById(threadId);

  if (!thread) {
    throw new Error("Thread não encontrada");
  }

  if (thread.workspaceId !== workspaceId) {
    throw new Error("Acesso negado à thread");
  }

  return thread;
}

export async function threadHasInboundMessage(workspaceId: string, threadId: string) {
  const snap = await adminFirestore
    .collection("inboxMessages")
    .where("workspaceId", "==", workspaceId)
    .where("threadId", "==", threadId)
    .where("direction", "==", "inbound")
    .limit(1)
    .get();

  return !snap.empty;
}

export async function createOutboundInboxMessage(params: {
  workspaceId: string;
  threadId: string;
  socialAccountId: string;
  text: string;
  senderType?: "agent" | "automation";
  platformMessageId?: string | null;
  deliveryStatus?: string;
  raw?: any;
}) {
  const now = admin.firestore.FieldValue.serverTimestamp();

  const message: MessageDoc = {
    workspaceId: params.workspaceId,
    threadId: params.threadId,
    socialAccountId: params.socialAccountId,
    network: "instagram",
    platformMessageId: params.platformMessageId || null,
    direction: "outbound",
    senderType: params.senderType || "agent",
    text: params.text,
    sentAt: now,
    deliveryStatus: params.deliveryStatus || "sent",
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdAt: now,
    raw: params.raw || null,
  };

  const ref = await adminFirestore.collection("inboxMessages").add(message);
  return ref.id;
}

export async function updateThreadAfterOutbound(params: {
  threadId: string;
  text: string;
}) {
  await adminFirestore.collection("inboxThreads").doc(params.threadId).update({
    lastMessageText: params.text,
    lastMessageDirection: "outbound",
    lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "open",
  });
}

export async function softDeleteInboxMessage(params: {
  workspaceId: string;
  threadId: string;
  messageId: string;
  deletedBy?: string;
}) {
  const ref = adminFirestore.collection("inboxMessages").doc(params.messageId);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new Error("Mensagem não encontrada");
  }

  const data = snap.data();

  if (data?.workspaceId !== params.workspaceId || data?.threadId !== params.threadId) {
    throw new Error("Acesso negado à mensagem");
  }

  await ref.update({
    isDeleted: true,
    deletedAt: admin.firestore.FieldValue.serverTimestamp(),
    deletedBy: params.deletedBy || "system",
  });
}

export async function updateThreadSettings(params: {
  workspaceId: string;
  threadId: string;
  automationEnabled?: boolean;
  status?: "open" | "pending" | "closed" | "archived";
}) {
  const thread = await assertThreadBelongsToWorkspace(params.threadId, params.workspaceId);

  const payload: Record<string, any> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (typeof params.automationEnabled === "boolean") {
    payload.automationEnabled = params.automationEnabled;
  }

  if (params.status) {
    payload.status = params.status;
  }

  await adminFirestore.collection("inboxThreads").doc(thread.id).update(payload);
  return true;
}
