// src/components/LogoutButton.tsx
"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export default function LogoutButton() {
  async function handleLogout() {
    await signOut(auth);
    window.location.assign("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-[#272046] px-4 py-2 text-white"
    >
      Sair
    </button>
  );
}
