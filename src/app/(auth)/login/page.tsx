// src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    console.log("tentando login...");

    if (!email || !password) {
      alert("Preencha email e senha");
      return;
    }

    setLoading(true);

    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      console.log("logado:", user.user.uid);
      window.location.assign("/dashboard");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050016]">
      <form
        onSubmit={handleLogin}
        className="bg-[#020012] p-6 rounded-2xl border border-[#272046] w-[320px]"
      >
        <h1 className="text-white text-lg mb-4">Entrar</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-[#0B001F] text-white"
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-2 rounded bg-[#0B001F] text-white"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 p-2 rounded text-white"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}