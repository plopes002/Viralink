'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';
import { Check, Eye, Bot, CalendarClock, Zap, BarChart2, Star, Twitter, Instagram, Facebook } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

const featureCards = [
  {
    icon: Eye,
    title: 'Monitoramento em Tempo Real',
    description: 'Acompanhe comentários, mensagens, menções e interações em um só painel.',
    color: 'primary',
  },
  {
    icon: Bot,
    title: 'Criação de Posts com IA',
    description: 'Gere títulos, legendas e hashtags automaticamente com IA inteligente.',
    color: 'secondary',
  },
  {
    icon: CalendarClock,
    title: 'Agendamento Inteligente',
    description: 'Programe publicações com recomendações de horários otimizados.',
    color: 'accent',
  },
  {
    icon: Zap,
    title: 'Automação Multicanal',
    description: 'Automatize mensagens no Instagram, Messenger e WhatsApp.',
    color: 'primary',
  },
  {
    icon: BarChart2,
    title: 'Análise de Concorrência',
    description: 'Compare métricas e descubra o que funciona no seu mercado.',
    color: 'secondary',
  },
];

const timelineItems = [
    { title: 'Conecte suas redes sociais', icon: Zap },
    { title: 'Receba tudo em um único painel', icon: LayoutGrid },
    { title: 'Crie posts com IA', icon: Bot },
    { title: 'Programe conteúdos', icon: CalendarClock },
    { title: 'Automatize mensagens', icon: MessageCircle },
    { title: 'Compare concorrentes', icon: Users },
    { title: 'Cresça mais rápido', icon: TrendingUp }
];

const pricingTiers = [
    {
        name: 'Basic',
        price: 'R$49,90',
        period: '/mês',
        description: 'Perfeito para indivíduos e pequenos negócios que estão começando.',
        features: [
            '1 rede social',
            '5 posts por IA',
            '5 agendamentos',
            'Analytics básico'
        ],
        cta: 'Assinar Basic',
    },
    {
        name: 'Pro',
        price: 'R$149,90',
        period: '/mês',
        description: 'Para negócios em crescimento que precisam de mais poder e automação.',
        features: [
            '3 redes sociais',
            'IA ilimitada',
            'Agendamentos ilimitados',
            '1 concorrente',
            'Analytics avançado'
        ],
        cta: 'Ir para o Pro',
        popular: true,
    },
    {
        name: 'Expert',
        price: 'R$349,90',
        period: '/mês',
        description: 'O kit de ferramentas definitivo para agências e especialistas de marketing.',
        features: [
            'Redes ilimitadas',
            'Posts IA ilimitados + recursos avançados',
            'Agendamentos ilimitados',
            '3 concorrentes',
            'Exportações PDF/CSV',
            'Suporte prioritário'
        ],
        cta: 'Tornar-se Expert',
    },
];

const testimonials = [
  {
    name: 'Júlia Alves',
    feedback: 'O Viralink transformou minha gestão de redes. A IA é simplesmente mágica e economiza horas do meu dia!',
    avatar: 'https://picsum.photos/seed/julia/100/100'
  },
  {
    name: 'Marcos Andrade',
    feedback: 'Finalmente uma plataforma que entende as necessidades de um social media. O painel unificado é um divisor de águas.',
    avatar: 'https://picsum.photos/seed/marcos/100/100'
  },
    {
    name: 'Beatriz Costa',
    feedback: 'A análise de concorrentes me deu insights que eu jamais teria sozinho. Indispensável para quem quer se destacar.',
    avatar: 'https://picsum.photos/seed/beatriz/100/100'
  }
];

import { LayoutGrid, MessageCircle, Users, TrendingUp } from 'lucide-react';


export default function Home() {
  const cardVariants = {
    offscreen: {
      y: 50,
      opacity: 0,
    },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        bounce: 0.4,
        duration: 0.8,
      },
    },
  };
  
  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground overflow-x-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-x-0 top-0 h-[800px] w-full bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"
      />

      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Logo className="text-primary" />
          <span className="font-headline text-foreground">VIRALINK</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</Link>
          <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</Link>
          <Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Depoimentos</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Link href="/signup">Começar Teste Gratuito</Link>
          </Button>
        </div>
      </header>
      
      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 md:pt-32 md:pb-40 text-center relative z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-300">
              Amplifique Sua Presença nas Redes com Inteligência Artificial
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              O VIRALINK é a plataforma completa para monitorar redes sociais, criar posts com IA, automatizar mensagens e superar seus concorrentes. Cresça mais, trabalhe menos.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button size="lg" className="w-full sm:w-auto font-bold text-base bg-gradient-to-r from-primary to-secondary text-primary-foreground transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-primary/50 hover:scale-105">
                <Link href="/signup">Começar Teste Gratuito</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold text-base border-border bg-transparent hover:bg-border/50 transition-colors">
                Ver Funcionalidades
              </Button>
            </div>
            <div className="mt-12 text-sm text-muted-foreground/80">
              <span>Instagram • Facebook • WhatsApp • </span><span className="text-primary/70">TikTok (em breve)</span>
            </div>
          </motion.div>
        </section>

        <section id="features" className="py-20 md:py-28 bg-card/50 border-y border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featureCards.map((feature, index) => (
                <motion.div
                  key={index}
                  initial="offscreen"
                  whileInView="onscreen"
                  viewport={{ once: true, amount: 0.5 }}
                  variants={cardVariants}
                >
                  <Card className="bg-card h-full flex flex-col border border-border/50 hover:border-primary/50 transition-colors duration-300 shadow-lg shadow-black/20">
                      <CardHeader>
                          <div className={`mb-4 inline-block p-3 rounded-lg bg-gradient-to-br from-${feature.color}/20 to-card`}>
                              <feature.icon className={`size-8 text-${feature.color}`} />
                          </div>
                          <CardTitle className="font-headline text-2xl text-foreground">
                              {feature.title}
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-muted-foreground">{feature.description}</p>
                      </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        <section id="how-it-works" className="py-20 md:py-28">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">Como o VIRALINK funciona?</h2>
                    <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                        Um fluxo de trabalho simplificado para potenciar sua estratégia digital em minutos.
                    </p>
                </div>
                <div className="relative">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/50 hidden md:block" aria-hidden="true"></div>
                    {timelineItems.map((item, index) => (
                        <motion.div 
                            key={index}
                            initial="offscreen"
                            whileInView="onscreen"
                            viewport={{ once: true, amount: 0.5 }}
                            variants={{
                                offscreen: { opacity: 0, x: index % 2 === 0 ? -50 : 50 },
                                onscreen: { opacity: 1, x: 0, transition: { duration: 0.5, delay: index * 0.1 } }
                            }}
                            className={`relative flex items-center mb-8 md:mb-0 ${index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}>
                            <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8 md:text-right'}`}>
                                <div className="p-6 bg-card border border-border/50 rounded-lg shadow-lg">
                                    <div className={`mb-3 inline-block p-2 rounded-md bg-gradient-to-br from-primary/20 to-card`}>
                                        <item.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                                </div>
                            </div>
                            <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-8 h-8 bg-background border-2 border-primary rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        <section id="pricing" className="py-20 md:py-28 bg-card/50 border-y border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">Encontre o Plano Perfeito</h2>
                    <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                        Comece de graça e escale conforme cresce. Todos os planos incluem 15 dias de teste gratuito.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
                    {pricingTiers.map((tier) => (
                        <motion.div
                          key={tier.name}
                          initial="offscreen"
                          whileInView="onscreen"
                          viewport={{ once: true, amount: 0.3 }}
                          variants={cardVariants}
                        >
                          <Card key={tier.name} className={`flex flex-col bg-card border text-foreground h-full transition-all duration-300 ${tier.popular ? 'border-primary shadow-2xl shadow-primary/20 scale-105' : 'border-border/50'}`}>
                              {tier.popular && <div className="bg-primary text-primary-foreground text-center text-sm font-bold py-2 rounded-t-lg">MAIS POPULAR</div>}
                              <CardHeader className="pt-8">
                                  <CardTitle className="font-headline text-2xl">{tier.name}</CardTitle>
                                  <CardDescription className="text-muted-foreground">{tier.description}</CardDescription>
                              </CardHeader>
                              <CardContent className="flex-grow">
                                  <div className="mb-6">
                                      <span className="text-5xl font-bold">{tier.price}</span>
                                      <span className="text-muted-foreground">{tier.period}</span>
                                  </div>
                                  <ul className="space-y-3">
                                      {tier.features.map((feature, i) => (
                                          <li key={i} className="flex items-center gap-3">
                                              <Check className="size-5 text-green-500" />
                                              <span className="text-muted-foreground">{feature}</span>
                                          </li>
                                      ))}
                                  </ul>
                              </CardContent>
                              <CardFooter className="p-6">
                                  <Button className={`w-full font-bold text-base ${tier.popular ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-lg hover:shadow-primary/50' : 'bg-primary/10 text-primary border border-primary hover:bg-primary/20'}`} asChild>
                                      <Link href="/signup">{tier.cta}</Link>
                                  </Button>
                              </CardFooter>
                          </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        <section id="testimonials" className="py-20 md:py-28">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold">Amado por Criadores e Marcas</h2>
                    <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                        Veja o que nossos clientes dizem sobre a revolução VIRALINK.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial="offscreen"
                            whileInView="onscreen"
                            viewport={{ once: true, amount: 0.5 }}
                            variants={cardVariants}
                        >
                            <Card className="bg-card border border-border/50 p-6 h-full">
                                <CardContent className="p-0 flex flex-col h-full">
                                    <div className="flex items-center mb-4">
                                        <Image src={testimonial.avatar} alt={testimonial.name} width={40} height={40} className="rounded-full" />
                                        <div className="ml-4">
                                            <p className="font-semibold text-foreground">{testimonial.name}</p>
                                            <div className="flex text-primary">
                                                <Star className="w-4 h-4 fill-current" />
                                                <Star className="w-4 h-4 fill-current" />
                                                <Star className="w-4 h-4 fill-current" />
                                                <Star className="w-4 h-4 fill-current" />
                                                <Star className="w-4 h-4 fill-current" />
                                            </div>
                                        </div>
                                    </div>
                                    <blockquote className="text-muted-foreground flex-grow">"{testimonial.feedback}"</blockquote>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
      </main>

      <footer className="bg-card border-t border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid md:grid-cols-4 gap-8">
                <div className="flex flex-col gap-4">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                      <Logo className="text-primary" />
                      <span className="font-headline text-foreground">VIRALINK</span>
                    </Link>
                    <p className="text-muted-foreground text-sm">Amplificando sua presença nas redes com inteligência artificial.</p>
                </div>
                <div>
                    <h4 className="font-headline text-lg font-semibold text-foreground mb-4">Produto</h4>
                    <ul className="space-y-3">
                        <li><Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</Link></li>
                        <li><Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</Link></li>
                        <li><Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-headline text-lg font-semibold text-foreground mb-4">Legal</h4>
                    <ul className="space-y-3">
                        <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Termos de Serviço</Link></li>
                        <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Política de Privacidade</Link></li>
                        <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contato</Link></li>
                    </ul>
                </div>
                <div>
                     <h4 className="font-headline text-lg font-semibold text-foreground mb-4">Redes Sociais</h4>
                     <div className="flex gap-4">
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter /></Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram /></Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook /></Link>
                    </div>
                </div>
            </div>
            <div className="mt-12 border-t border-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Viralink. Todos os direitos reservados.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
