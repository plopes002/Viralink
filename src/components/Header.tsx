'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-vbg/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Logo className="h-7 w-7 text-vcyan" />
          <span className="font-headline text-white">ViralinkAI</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="#features" className="text-sm text-white hover:text-vpurple transition-colors">
            Funcionalidades
          </Link>
          <Link href="#pricing" className="text-sm text-white hover:text-vpurple transition-colors">
            Planos
          </Link>
        </nav>
        <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex border-vborder bg-transparent text-white hover:bg-white/5 hover:text-white" asChild>
                <Link href="/login">Entrar</Link>
            </Button>
            <Button size="sm" className="bg-vpurple text-white hover:bg-vpurple/90" asChild>
                <Link href="/signup">Começar Agora</Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
