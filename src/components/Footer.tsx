import Link from 'next/link';
import { Logo } from '@/components/icons/logo';

export default function Footer() {
  return (
    <footer className="bg-vbg border-t border-vborder">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex flex-col items-center md:items-start gap-2">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                    <Logo className="h-7 w-7 text-vcyan" />
                    <span className="font-headline text-white">ViralinkAI</span>
                </Link>
                <p className="text-sm text-vborder">
                    © {new Date().getFullYear()} ViralinkAI. Todos os direitos reservados.
                </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-vborder">
                <Link href="#" className="hover:text-white transition-colors">Termos de Uso</Link>
                <Link href="#" className="hover:text-white transition-colors">Privacidade</Link>
                <Link href="#" className="hover:text-white transition-colors">Contato</Link>
            </div>
        </div>
      </div>
    </footer>
  );
}
