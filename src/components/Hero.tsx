'use client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ThumbsUp, MessageCircle, Share2, Instagram, Facebook, MessageSquare } from 'lucide-react';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-vbg py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.3),rgba(255,255,255,0))]"></div>
      <div className="container relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="text-center md:text-left"
        >
          <h1 className="font-headline text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            Amplifique Sua Presença nas Redes com Inteligência Artificial
          </h1>
          <p className="mt-6 text-lg text-vborder max-w-2xl mx-auto md:mx-0">
            O VIRALINK é a plataforma completa para monitorar redes sociais, criar posts com IA, automatizar mensagens e superar seus concorrentes. Cresça mais, trabalhe menos.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row md:justify-start">
            <Button size="lg" className="w-full bg-vpurple font-bold text-white hover:bg-vpurple/90 sm:w-auto" asChild>
              <Link href="/signup">Começar Teste Gratuito</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full border-vcyan text-vcyan hover:bg-vcyan/10 hover:text-vcyan sm:w-auto" asChild>
              <Link href="#features">Ver Funcionalidades</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-vborder md:justify-start">
            <Instagram className="h-5 w-5 text-vmagenta" />
            <Facebook className="h-5 w-5 text-vcyan" />
            <MessageSquare className="h-5 w-5 text-vpurple" />
            <span>Suporte a Instagram, Facebook e WhatsApp. TikTok em breve.</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="relative"
        >
            <div className="bg-vcard rounded-xl p-4 border border-vborder shadow-2xl shadow-black/50">
                <div className="flex items-center gap-3 mb-4">
                    <Image src="https://picsum.photos/seed/viralink-avatar/40/40" alt="User Avatar" width={40} height={40} className="rounded-full" />
                    <div>
                        <p className="font-semibold text-white">ViralinkAI</p>
                        <p className="text-xs text-vborder">@viralink_ai</p>
                    </div>
                </div>
                <Image src="https://picsum.photos/seed/viralink-post/600/400" alt="Social media post example" width={600} height={400} className="rounded-lg w-full" data-ai-hint="futuristic technology" />
                <div className="flex items-center justify-between mt-4 text-vborder">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-vmagenta">
                            <ThumbsUp className="h-5 w-5" />
                            <span className="text-sm">1.2k</span>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer hover:text-vcyan">
                            <MessageCircle className="h-5 w-5" />
                            <span className="text-sm">150</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer hover:text-vpurple">
                        <Share2 className="h-5 w-5" />
                    </div>
                </div>
            </div>
        </motion.div>
      </div>
    </section>
  );
}
