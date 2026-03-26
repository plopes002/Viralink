// src/firebase/processingQueue.ts
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  Firestore,
} from "firebase/firestore";
import type { ProcessingQueueJob, QueueJobType } from "@/types/processingQueue";

const COLLECTION = "processingQueue";

export async function enqueueJob(
  firestore: Firestore,
  data: {
    type: QueueJobType;
    workspaceId: string;
    engagementId?: string;
    payload?: Record<string, any>;
  },
) {
  const now = new Date().toISOString();

  const ref = await addDoc(collection(firestore, COLLECTION), {
    type: data.type,
    workspaceId: data.workspaceId,
    engagementId: data.engagementId || null,
    status: "pending",
    attempts: 0,
    payload: data.payload || {},
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  });

  return ref.id;
}

export async function updateQueueJob(
  firestore: Firestore,
  id: string,
  data: Partial<ProcessingQueueJob>,
) {
  const ref = doc(firestore, COLLECTION, id);

  await updateDoc(ref, {
    ...data,
    updatedAt: new Date().toISOString(),
  } as any);
}
