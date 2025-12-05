// src/firebase/posts.ts
import {
  collection,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import type { PostDocument } from "@/types/post";

const POSTS_COLLECTION = "posts";

// Note: These functions are designed to be used inside React components
// where the useFirebase hook is available.

export function usePostActions() {
  const { firestore } = useFirebase();

  async function createPost(
    data: Omit<PostDocument, "id" | "createdAt" | "updatedAt">
  ) {
    const now = new Date().toISOString();
    const ref = await addDoc(collection(firestore, POSTS_COLLECTION), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }

  async function updatePost(id: string, data: Partial<PostDocument>) {
    const ref = doc(firestore, POSTS_COLLECTION, id);
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }
  
  return { createPost, updatePost };
}
