// src/lib/messageDedup.ts
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function hasRecentSimilarMessage(params: {
  workspaceId: string;
  toUser?: string | null;
  toPhone?: string | null;
  channel: string;
  lookbackHours?: number;
}) {
  const lookbackHours = params.lookbackHours ?? 72;
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

  const snap = await adminFirestore
    .collection("messages")
    .where("workspaceId", "==", params.workspaceId)
    .where("channel", "==", params.channel)
    .where("status", "in", ["scheduled", "processing", "sent"])
    .get();

  const rows = snap.docs.map((d) => d.data() as any);

  return rows.some((m) => {
    const sameTarget =
      (params.toUser && m.toUser === params.toUser) ||
      (params.toPhone && m.toPhone === params.toPhone);

    return sameTarget && String(m.createdAt || "") >= since;
  });
}
