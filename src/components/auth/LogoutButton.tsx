// src/components/auth/LogoutButton.tsx
"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/session-logout", { method: "POST" });
    await signOut(auth);
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border px-4 py-2"
    >
      Sair
    </button>
  );
}