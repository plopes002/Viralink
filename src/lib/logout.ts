// src/lib/logout.ts
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export async function logout() {
  await signOut(auth);
  window.location.assign("/login");
}


