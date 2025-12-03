'use client';
import { motion } from 'framer-motion';
import { Eye, Bot, CalendarClock, Zap } from 'lucide-react';
import { ReactElement } from 'react';

type Feature = {
  icon: ReactElement;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: <Eye className="h-8 w-8 text-vpurple" />,
    title: 'Monitoramento em Tempo Real',
    description: 'Acompanhe comentários, mensagens, menções e interações em um único painel.',
  },
  {
    icon: <Bot className="h-8 w-8 text-vcyan" />,
    title: 'Criação de Posts com IA',
    description: 'Gere títulos, legendas e hashtags otimizadas com IA em segundos.',
  },
  {
    icon: <CalendarClock className="h-8 w-8 text-vmagenta" />,
    title: 'Agendamento Inteligente',
    description: 'Programe publicações com recomendações automáticas de horários.',
  },
  {
    icon: <Zap className="h-8 w-8 text-vpurple" />,
    title: 'Automação Multicanal',
    description: 'Automatize respostas no Instagram, Messenger e WhatsApp com fluxos inteligentes.',
  },
];

const cardVariants = {
  offscreen: {
    y: 50,
    opacity: 0,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.4,
      duration: 0.8,
    },
  },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-vbg py-20 sm:py-28 border-t border-vborder">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-white">
            Tudo o que você precisa para dominar as redes sociais
          </h2>
          <p className="text-vborder mt-4 max-w-2xl mx-auto">
            De criação de conteúdo a relatórios avançados, o Viralink automatiza o que é manual e mostra o que realmente importa.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.3 }}
              variants={cardVariants}
              transition={{ delay: index * 0.1 }}
              className="bg-vcard p-8 rounded-xl border border-vborder/50 transition-all duration-300 hover:border-vpurple/50 hover:shadow-2xl hover:shadow-vpurple/10 hover:-translate-y-1"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-vpurple/10">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">{feature.title}</h3>
              <p className="text-vborder">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
