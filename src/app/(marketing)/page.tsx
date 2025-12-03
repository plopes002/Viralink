// app/page.tsx
"use client";

import { motion } from "framer-motion";
import Link from 'next/link';
import { FiZap, FiMessageCircle, FiClock, FiShare2 } from "react-icons/fi";

const BG = "#050017";
const CARD = "#0B001F";
const BORDER = "#261341";
const PURPLE = "#7C3AED";
const MAGENTA = "#C026D3";
const CYAN = "#0EA5E9";
const TEXT_LIGHT = "#E5E7EB";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <Header />
      <main className="max-w-6xl mx-auto px-4 pb-16">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header
      className="w-full border-b border-[#1F1033]/80"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(124,58,237,0.45), transparent 50%), radial-gradient(circle at top right, rgba(192,38,211,0.35), transparent 55%)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, #7C3AED 0%, #C026D3 50%, #0EA5E9 100%)",
            }}
          >
            <span className="text-xs font-bold text-white">V</span>
          </div>
          <span className="font-semibold text-sm md:text-base text-white">
            ViralinkAI
          </span>
        </div>

        {/* Nav + Ações */}
        <div className="flex items-center gap-4 text-xs md:text-sm">
          <nav className="hidden md:flex items-center gap-6 text-[#CBD5E1]">
            <a href="#funcionalidades" className="hover:text-white transition">
              Funcionalidades
            </a>
            <a href="#planos" className="hover:text-white transition">
              Planos
            </a>
          </nav>
          <Link href="/login" passHref>
            <button className="px-4 py-1.5 rounded-full border border-[#312356] text-[#E5E7EB] hover:bg-white/5 transition">
                Entrar
            </button>
          </Link>
          <Link href="/signup" passHref>
            <button
                className="px-4 py-1.5 rounded-full font-semibold text-sm text-white shadow-lg"
                style={{
                background:
                    "linear-gradient(90deg, #7C3AED 0%, #C026D3 50%, #0EA5E9 100%)",
                }}
            >
                Começar Agora
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="mt-10 md:mt-14 grid md:grid-cols-[1.1fr,0.9fr] gap-10 items-start">
      {/* Texto */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
          Amplifique Sua Presença nas Redes com{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7C3AED] via-[#C026D3] to-[#0EA5E9]">
            Inteligência Artificial
          </span>
        </h1>
        <p className="mt-4 text-sm md:text-base text-[#CBD5E1] max-w-xl">
          O VIRALINK é a plataforma completa para monitorar redes sociais, criar
          posts com IA, automatizar mensagens e superar seus concorrentes. Cresça
          mais, trabalhe menos.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/signup" passHref>
                <button
                    className="px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-lg"
                    style={{
                    background:
                        "linear-gradient(90deg, #7C3AED 0%, #C026D3 50%, #0EA5E9 100%)",
                    }}
                >
                    Começar Teste Gratuito
                </button>
            </Link>
          <a href="#funcionalidades">
            <button className="px-5 py-2.5 rounded-full text-sm font-semibold border border-[#312356] text-[#E5E7EB] hover:bg-white/5 transition">
                Ver Funcionalidades
            </button>
          </a>
        </div>

        <p className="mt-4 text-xs md:text-sm text-[#9CA3AF] flex items-center gap-2">
          Suporte a Instagram, Facebook e WhatsApp.{" "}
          <span className="text-[#C026D3] font-medium">TikTok em breve.</span>
        </p>
      </motion.div>

      {/* Card estilo post / feed social */}
      <motion.div
        className="rounded-3xl p-4 md:p-5"
        style={{
          background:
            "radial-gradient(circle at top, rgba(124,58,237,0.25), transparent 60%), #050012",
          border: `1px solid ${BORDER}`,
        }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6 }}
      >
        {/* Header do post */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#C026D3] flex items-center justify-center text-xs font-bold text-white">
              VA
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">
                ViralinkAI
              </span>
              <span className="text-[11px] text-[#9CA3AF]">há 5 min</span>
            </div>
          </div>
          <span className="text-[#9CA3AF] text-lg">•••</span>
        </div>

        {/* Imagem fake */}
        <div className="rounded-2xl overflow-hidden mb-3">
          <div
            className="h-40 md:h-48 w-full"
            style={{
              background:
                "linear-gradient(135deg, #7C3AED 0%, #C026D3 40%, #0EA5E9 100%)",
            }}
          />
        </div>

        {/* Ações do post */}
        <div className="flex items-center justify-between text-xs text-[#E5E7EB] mb-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              ❤️ <span className="text-[11px] text-[#9CA3AF]">2.4k</span>
            </span>
            <span className="flex items-center gap-1">
              💬 <span className="text-[11px] text-[#9CA3AF]">318</span>
            </span>
            <span className="flex items-center gap-1">
              🔁 <span className="text-[11px] text-[#9CA3AF]">92</span>
            </span>
          </div>
          <span className="text-[11px] text-[#9CA3AF]">Post agendado • IA ativa</span>
        </div>

        {/* Barrinha de redes */}
        <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF]">
          <span className="px-2 py-1 rounded-full bg-[#1F1033] text-[#E5E7EB]">
            Instagram
          </span>
          <span className="px-2 py-1 rounded-full bg-[#1F1033] text-[#E5E7EB]">
            Facebook
          </span>
          <span className="px-2 py-1 rounded-full bg-[#1F1033] text-[#E5E7EB]">
            WhatsApp
          </span>
        </div>
      </motion.div>
    </section>
  );
}

function FeaturesSection() {
  const cards = [
    {
      title: "Monitoramento em Tempo Real",
      description:
        "Acompanhe comentários, mensagens, menções e interações em um único painel.",
      icon: <FiMessageCircle />,
    },
    {
      title: "Criação de Posts com IA",
      description:
        "Gere títulos, legendas e hashtags otimizadas com IA em segundos.",
      icon: <FiZap />,
    },
    {
      title: "Agendamento Inteligente",
      description:
        "Programe publicações com recomendações automáticas de horários.",
      icon: <FiClock />,
    },
    {
      title: "Automação Multicanal",
      description:
        "Automatize respostas no Instagram, Messenger e WhatsApp com fluxos inteligentes.",
      icon: <FiShare2 />,
    },
  ];

  return (
    <section id="funcionalidades" className="mt-14 md:mt-20">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-white">
          Tudo o que você precisa para dominar as redes sociais
        </h2>
        <p className="mt-3 text-sm md:text-base text-[#9CA3AF] max-w-2xl mx-auto">
          De criação de conteúdo a relatórios avançados, o Viralink automatiza o
          que é manual e mostra o que realmente importa.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            className="rounded-2xl p-4 h-full flex flex-col"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-full mb-3"
              style={{
                background:
                  i % 2 === 0
                    ? "linear-gradient(135deg, #7C3AED, #C026D3)"
                    : "linear-gradient(135deg, #0EA5E9, #7C3AED)",
              }}
            >
              <span className="text-white text-lg">{card.icon}</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-2">
              {card.title}
            </h3>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              {card.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="planos" className="mt-16 md:mt-20">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-white">
          Escolha seu Plano
        </h2>
        <p className="mt-2 text-sm md:text-base text-[#9CA3AF] max-w-xl mx-auto">
          Comece com 15 dias grátis. Sem burocracia, cancele quando quiser.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* BASIC */}
        <div
          className="rounded-2xl p-6 flex flex-col justify-between"
          style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
        >
          <div>
            <h3 className="text-lg font-semibold text-white">Basic</h3>
            <p className="text-xs text-[#9CA3AF] mt-1 mb-4">
              Ideal para perfis individuais e pequenos negócios.
            </p>
            <p className="text-3xl font-bold text-white">
              R$ 49,90
              <span className="text-xs font-normal text-[#9CA3AF]"> /mês</span>
            </p>
            <ul className="mt-4 space-y-2 text-xs text-[#CBD5E1]">
              <li>• 1 rede social conectada</li>
              <li>• 5 posts gerados por IA</li>
              <li>• 5 posts agendados</li>
              <li>• Analytics básico</li>
              <li>• Teste grátis de 15 dias</li>
            </ul>
          </div>
          <Link href="/signup" passHref>
            <button className="mt-6 w-full rounded-full border border-[#7C3AED] py-2 text-xs font-semibold text-[#7C3AED] hover:bg-[#7C3AED]/10 transition">
                Assinar Basic
            </button>
          </Link>
        </div>

        {/* PRO – destaque */}
        <div className="relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#050013] border border-[#7C3AED] text-[10px] px-3 py-1 rounded-full text-[#E5E7EB]">
            Mais popular
          </div>
          <div
            className="rounded-2xl p-[1px]"
            style={{
              background:
                "linear-gradient(135deg, #7C3AED 0%, #C026D3 40%, #0EA5E9 100%)",
            }}
          >
            <div
              className="rounded-2xl p-6 flex flex-col justify-between h-full"
              style={{ backgroundColor: "#050013" }}
            >
              <div>
                <h3 className="text-lg font-semibold text-white">Pro</h3>
                <p className="text-xs text-[#E5E7EB] mt-1 mb-4">
                  Para negócios em crescimento que precisam de automação real.
                </p>
                <p className="text-3xl font-bold text-white">
                  R$ 149,90
                  <span className="text-xs font-normal text-[#D1D5DB]">
                    {" "}
                    /mês
                  </span>
                </p>
                <ul className="mt-4 space-y-2 text-xs text-[#E5E7EB]">
                  <li>• 3 redes sociais conectadas</li>
                  <li>• Posts gerados por IA ilimitados</li>
                  <li>• Agendamentos ilimitados</li>
                  <li>• Análise de 1 concorrente</li>
                  <li>• Analytics avançado</li>
                </ul>
              </div>
              <Link href="/signup" passHref>
                <button className="mt-6 w-full rounded-full bg-[#7C3AED] py-2 text-xs font-semibold text-white hover:bg-[#652BC2] transition">
                    Ir para o Pro
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* EXPERT */}
        <div
          className="rounded-2xl p-6 flex flex-col justify-between"
          style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
        >
          <div>
            <h3 className="text-lg font-semibold text-white">Expert</h3>
            <p className="text-xs text-[#9CA3AF] mt-1 mb-4">
              Para agências e times de marketing que querem controle total.
            </p>
            <p className="text-3xl font-bold text-white">
              R$ 349,90
              <span className="text-xs font-normal text-[#9CA3AF]"> /mês</span>
            </p>
            <ul className="mt-4 space-y-2 text-xs text-[#CBD5E1]">
              <li>• Redes sociais ilimitadas</li>
              <li>• IA ilimitada + recursos avançados</li>
              <li>• Agendamentos ilimitados</li>
              <li>• Análise de até 3 concorrentes</li>
              <li>• Exportação de relatórios (PDF/CSV)</li>
              <li>• Suporte prioritário</li>
            </ul>
          </div>
          <Link href="/signup" passHref>
            <button className="mt-6 w-full rounded-full border border-[#0EA5E9] py-2 text-xs font-semibold text-[#0EA5E9] hover:bg-[#0EA5E9]/10 transition">
                Tornar-se Expert
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#1F1033] mt-16">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-[#9CA3AF]">
        <span>© 2025 ViralinkAI. Todos os direitos reservados.</span>
        <div className="flex gap-4">
          <button className="hover:text-[#E5E7EB]">Termos</button>
          <button className="hover:text-[#E5E7EB]">Privacidade</button>
          <button className="hover:text-[#E5E7EB]">Contato</button>
        </div>
      </div>
    </footer>
  );
}
