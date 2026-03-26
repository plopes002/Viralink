// src/lib/suppression.ts
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function isSuppressed(params: {
  workspaceId: string;
  toUser?: string | null;
  toPhone?: string | null;
}) {
  const snap = await adminFirestore
    .collection("suppressionList")
    .where("workspaceId", "==", params.workspaceId)
    .get();

  const rows = snap.docs.map((d) => d.data() as any);

  return rows.some((row) => {
    return (
      (params.toUser && row.toUser === params.toUser) ||
      (params.toPhone && row.toPhone === params.toPhone)
    );
  });
}
