// app/(app)/layout.tsx
"use client";

import "../globals.css";
import Link from "next/link";
import { ReactNode, useState } from "react";
import {
  FiHome,
  FiEdit3,
  FiZap,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiShare2,
  FiMenu,
  FiX,
  FiPlayCircle,
  FiHeart,
  FiUserCheck,
  FiSend,
  FiBriefcase,
  FiClipboard,
  FiShield,
  FiClock,
} from "react-icons/fi";
import { NotificationsBell } from "./components/NotificationsBell";
import { useUser } from "@/firebase/provider";
import { FirebaseClientProvider } from "@/firebase/client-provider";

const BG = "#050017";
const SIDEBAR = "#050012";
const BORDER = "#261341";

const navItems = [
  { href: "/dashboard", label: "Visão geral", icon: FiHome },
  { href: "/executivo", label: "Executivo", icon: FiBriefcase },
  { href: "/posts", label: "Posts & Agenda", icon: FiEdit3 },
  { href: "/automations", label: "Automações", icon: FiZap },
  { href: "/engajamento", label: "Engajamento", icon: FiHeart },
  { href: "/perfis", label: "Perfis Consolidados", icon: FiUserCheck },
  { href: "/contatos", label: "Contatos (CRM)", icon: FiClipboard },
  { href: "/campanhas", label: "Campanhas", icon: FiSend },
  { href: "/revisao", label: "Revisão", icon: FiShield },
  { href: "/social-accounts", label: "Contas conectadas", icon: FiShare2 },
  { href: "/concorrentes", label: "Concorrentes", icon: FiUsers },
  { href: "/fila", label: "Fila", icon: FiClock },
  { href: "/analytics", label: "Analytics", icon: FiBarChart2 },
  { href: "/settings", label: "Configurações", icon: FiSettings },
  { href: "/demo", label: "Modo Demo", icon: FiPlayCircle },
];

function AppLayoutContent({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: BG }}>
      {/* SIDEBAR DESKTOP */}
      <aside
        className="hidden md:flex md:flex-col w-64 border-r"
        style={{ backgroundColor: SIDEBAR, borderColor: BORDER }}
      >
        <div className="px-6 py-5 flex items-center gap-3 border-b" style={{ borderColor: BORDER }}>
          <div
            className="h-9 w-9 rounded-2xl flex items-center justify-center text-sm font-bold text-white"
            style={{
              background:
                "linear-gradient(135deg, #7C3AED 0%, #C026D3 40%, #0EA5E9 100%)",
            }}
          >
            V
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">ViralinkAI</span>
            <span className="text-[11px] text-[#9CA3AF]">Painel de controle</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#CBD5E1] hover:text-white hover:bg-white/5 transition"
            >
              <Icon className="text-lg" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 text-[11px] text-[#9CA3AF] border-t" style={{ borderColor: BORDER }}>
          <p className="mb-1">
            Plano atual: <span className="text-[#7C3AED] font-semibold">Pro</span>
          </p>
          <p>
            Uso de IA este mês:{" "}
            <span className="text-[#0EA5E9] font-semibold">62 gerações</span>
          </p>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 pb-10 pt-4">
          {children}
        </main>
      </div>
    </div>
  );
}

function Topbar() {
  const [openMobileNav, setOpenMobileNav] = useState(false);
  const { user } = useUser();
  const currentWorkspaceId = "agency_123"; // TODO: Replace with dynamic workspace ID from context

  return (
    <header
      className="w-full border-b relative z-40"
      style={{
        borderColor: BORDER,
        background:
          "radial-gradient(circle at top left, rgba(124,58,237,0.35), transparent 55%), radial-gradient(circle at top right, rgba(14,165,233,0.25), transparent 55%), #050017",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-[#9CA3AF]">Bem-vindo de volta,</span>
          <span className="text-sm md:text-base font-semibold text-white">
            Agência Digital Exemplo
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Infos rápidas só no desktop */}
          <div className="hidden md:flex flex-col items-end text-[11px] text-[#CBD5E1]">
            <span>
              Taxa de resposta hoje:{" "}
              <span className="text-[#22C55E] font-semibold">92%</span>
            </span>
            <span>
              Mensagens pendentes:{" "}
              <span className="text-[#F97316] font-semibold">7</span>
            </span>
          </div>

          <NotificationsBell workspaceId={currentWorkspaceId} uid={user?.uid ?? null} />

          {/* Botão menu mobile */}
          <button
            className="md:hidden h-8 w-8 rounded-full border border-[#312356] flex items-center justify-center text-[#E5E7EB] bg-black/20 backdrop-blur-sm"
            onClick={() => setOpenMobileNav((v) => !v)}
            aria-label="Abrir menu"
          >
            {openMobileNav ? <FiX size={16} /> : <FiMenu size={16} />}
          </button>

          {/* Avatar */}
          <button className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#C026D3] flex items-center justify-center text-xs font-bold text-white">
            AD
          </button>
        </div>
      </div>

      {/* MENU MOBILE – overlay suave */}
      {openMobileNav && (
        <div className="md:hidden absolute inset-x-0 top-full pb-3 px-3">
          <div className="rounded-2xl border border-[#312356] bg-[#050017]/95 backdrop-blur-xl shadow-2xl">
            <nav className="py-2 text-sm">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-4 py-2 text-[#CBD5E1] hover:bg-white/5 hover:text-white transition"
                  onClick={() => setOpenMobileNav(false)}
                >
                  <Icon className="text-base" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}


export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </FirebaseClientProvider>
  )
}
