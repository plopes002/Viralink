// src/lib/upload-helper.ts
"use client";

import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
  FirebaseStorage,
} from "firebase/storage";

/**
 * Uploads a base64 encoded image string to Firebase Storage.
 * @param storage - The Firebase Storage instance.
 * @param base64 - The base64 string of the image (can be a data URL).
 * @param pathPrefix - The folder path in storage (e.g., 'draft-images/userId').
 * @returns The public download URL of the uploaded image.
 */
export async function uploadBase64ImageToStorage(
  storage: FirebaseStorage,
  base64: string,
  pathPrefix: string,
): Promise<string> {
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
  const storageRef = ref(storage, `${pathPrefix}/${fileName}`);

  // uploadString handles data URLs (e.g., "data:image/png;base64,...") automatically.
  await uploadString(storageRef, base64, "data_url");

  const url = await getDownloadURL(storageRef);
  return url;
}
