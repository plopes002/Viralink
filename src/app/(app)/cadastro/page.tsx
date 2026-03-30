// src/app/cadastro/page.tsx
"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export default function CadastroPage() {
  const router = useRouter();
  const { auth, firestore } = useFirebase() as any;

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length >= 3 &&
      validateEmail(form.email) &&
      form.password.length >= 6 &&
      form.confirmPassword.length >= 6
    );
  }, [form]);

  function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!auth || !firestore) {
      setErrorMessage("Serviço de autenticação não disponível no momento.");
      return;
    }

    if (!form.name.trim()) {
      setErrorMessage("Informe seu nome.");
      return;
    }

    if (!validateEmail(form.email)) {
      setErrorMessage("Informe um e-mail válido.");
      return;
    }

    if (form.password.length < 6) {
      setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage("As senhas não conferem.");
      return;
    }

    try {
      setSubmitting(true);

      const credential = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      const user = credential.user;

      await updateProfile(user, {
        displayName: form.name.trim(),
      });

      await setDoc(
        doc(firestore, "users", user.uid),
        {
          uid: user.uid,
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          role: "owner",
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSuccessMessage("Cadastro realizado com sucesso.");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error: any) {
      const code = error?.code || "";

      if (code === "auth/email-already-in-use") {
        setErrorMessage("Este e-mail já está em uso.");
      } else if (code === "auth/invalid-email") {
        setErrorMessage("E-mail inválido.");
      } else if (code === "auth/weak-password") {
        setErrorMessage("Senha fraca. Use pelo menos 6 caracteres.");
      } else {
        setErrorMessage(error?.message || "Não foi possível concluir o cadastro.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050016] px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl overflow-hidden rounded-3xl border border-[#272046] bg-[#0A0322] shadow-2xl">
        <section className="hidden w-[45%] flex-col justify-between border-r border-[#272046] bg-gradient-to-b from-[#12052f] to-[#050016] p-8 lg:flex">
          <div>
            <p className="text-sm font-medium text-[#C4B5FD]">ViraMind</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white">
              Crie sua conta e comece a conectar suas redes.
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#9CA3AF]">
              Cadastre-se para acessar automações, concorrentes, interações,
              campanhas e painéis do sistema.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-[#272046] bg-[#050016]/70 p-4">
              <p className="text-xs font-medium text-white">Conta única</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                Use seu e-mail para entrar e gerenciar tudo em um só lugar.
              </p>
            </div>

            <div className="rounded-2xl border border-[#272046] bg-[#050016]/70 p-4">
              <p className="text-xs font-medium text-white">Configuração rápida</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                Depois do cadastro, você já pode conectar Instagram e Facebook.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full p-6 sm:p-8 lg:w-[55%]">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white">Criar conta</h2>
              <p className="mt-2 text-sm text-[#9CA3AF]">
                Preencha seus dados para começar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm text-[#E5E7EB]">
                  Nome
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-2xl border border-[#272046] bg-[#050016] px-4 py-3 text-sm text-white outline-none transition focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-[#E5E7EB]">
                  E-mail
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="voce@empresa.com"
                  className="w-full rounded-2xl border border-[#272046] bg-[#050016] px-4 py-3 text-sm text-white outline-none transition focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-[#E5E7EB]">
                  Senha
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className="w-full rounded-2xl border border-[#272046] bg-[#050016] px-4 py-3 text-sm text-white outline-none transition focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-[#E5E7EB]">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    updateField("confirmPassword", e.target.value)
                  }
                  placeholder="Repita sua senha"
                  className="w-full rounded-2xl border border-[#272046] bg-[#050016] px-4 py-3 text-sm text-white outline-none transition focus:border-[#8B5CF6]"
                />
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="mt-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Criando conta..." : "Criar conta"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[#9CA3AF]">
              Já tem conta?{" "}
              <Link href="/login" className="font-medium text-white hover:underline">
                Entrar
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}