'use client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';

const tiers = [
  {
    name: 'Basic',
    price: 'R$ 49,90',
    priceSuffix: '/mês',
    features: [
      '1 rede social conectada',
      '5 posts gerados por IA',
      '5 posts agendados',
      'Analytics básico',
      'Teste grátis de 15 dias',
    ],
    cta: 'Assinar Basic',
    ctaVariant: 'outline',
    ctaColor: 'vpurple'
  },
  {
    name: 'Pro',
    price: 'R$ 149,90',
    priceSuffix: '/mês',
    features: [
      '3 redes sociais conectadas',
      'Posts gerados por IA ilimitados',
      'Agendamentos ilimitados',
      'Análise de 1 concorrente',
      'Analytics avançado',
    ],
    cta: 'Ir para o Pro',
    popular: true,
    ctaVariant: 'solid',
  },
  {
    name: 'Expert',
    price: 'R$ 349,90',
    priceSuffix: '/mês',
    features: [
      'Redes sociais ilimitadas',
      'IA ilimitada + recursos avançados',
      'Agendamentos ilimitados',
      'Análise de até 3 concorrentes',
      'Exportação de relatórios em PDF/CSV',
      'Suporte prioritário',
    ],
    cta: 'Tornar-se Expert',
    ctaVariant: 'outline',
    ctaColor: 'vcyan'
  },
];

const cardVariants = {
    offscreen: { y: 50, opacity: 0 },
    onscreen: { y: 0, opacity: 1, transition: { type: "spring", bounce: 0.4, duration: 0.8 } }
};

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-28 bg-vbg border-t border-vborder">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-white">Escolha seu Plano</h2>
          <p className="text-vborder mt-4 max-w-xl mx-auto">
            Comece com 15 dias grátis. Sem burocracia, cancele quando quiser.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:items-start">
          {tiers.map((tier, index) => (
            <motion.div
                key={tier.name}
                initial="offscreen"
                whileInView="onscreen"
                viewport={{ once: true, amount: 0.3 }}
                variants={cardVariants}
                transition={{ delay: index * 0.1 }}
                className={`relative flex flex-col h-full rounded-2xl bg-vcard p-8 border transition-all duration-300 ${
                tier.popular ? 'border-transparent [background:padding-box_border-box,linear-gradient(135deg,theme(colors.vpurple),theme(colors.vcyan))_border-box] -translate-y-4 shadow-2xl shadow-vpurple/20' : 'border-vborder hover:border-vpurple/50'
                }`}
            >
              {tier.popular && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    <div className="rounded-full bg-vpurple px-4 py-1 text-xs font-semibold text-white">
                    Mais Popular
                    </div>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-white">{tier.price}</span>
                <span className="text-vborder">{tier.priceSuffix}</span>
              </div>
              <ul className="space-y-4 text-vborder flex-grow">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-vsuccess" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild className={`w-full font-bold ${
                    tier.ctaVariant === 'solid' ? 'bg-vpurple text-white hover:bg-vpurple/90' :
                    tier.ctaColor === 'vpurple' ? 'bg-transparent border border-vpurple text-vpurple hover:bg-vpurple/10' :
                    'bg-transparent border border-vcyan text-vcyan hover:bg-vcyan/10'
                }`}>
                  <Link href="/signup">{tier.cta}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
