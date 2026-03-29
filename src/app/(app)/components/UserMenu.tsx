// src/app/(app)/components/UserMenu.tsx
"use client";

import { useState } from "react";
import { logout } from "@/lib/logout";

export default function UserMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 rounded-full bg-purple-500 flex items-center justify-center text-white cursor-pointer hover:opacity-90"
      >
        AD
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-[#020012] border border-[#272046] rounded-xl p-2 shadow-xl">
          <button
            type="button"
            onClick={logout}
            className="w-full text-left text-sm text-white px-3 py-2 hover:bg-[#111827] rounded-lg"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}