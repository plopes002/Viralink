import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';
import { Check, BotMessageSquare, CalendarClock, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const features = [
  {
    icon: Share2,
    title: 'Social Monitoring',
    description: 'Connect your social accounts and get a holistic view of your performance in one place.',
    image: PlaceHolderImages.find(img => img.id === 'feature-monitoring'),
  },
  {
    icon: BotMessageSquare,
    title: 'AI Post Generation',
    description: 'Never run out of ideas. Generate engaging posts, titles, and hashtags with our advanced AI.',
    image: PlaceHolderImages.find(img => img.id === 'feature-ai-post'),
  },
  {
    icon: CalendarClock,
    title: 'Content Scheduling',
    description: 'Plan your content calendar and automatically publish posts at the most optimal times.',
    image: PlaceHolderImages.find(img => img.id === 'feature-scheduling'),
  },
];

const pricingTiers = [
    {
        name: 'Basic',
        price: 'R$49,90',
        period: '/mês',
        description: 'Perfect for individuals and small businesses getting started.',
        features: [
            '1 Social Network',
            '5 AI-generated Posts',
            '5 Scheduled Posts',
            'Basic Analytics'
        ],
        cta: 'Start with Basic',
    },
    {
        name: 'Pro',
        price: 'R$149,90',
        period: '/mês',
        description: 'For growing businesses that need more power and automation.',
        features: [
            '3 Social Networks',
            'Unlimited AI Posts',
            'Unlimited Scheduling',
            'Competitor Analysis (1)',
            'Advanced Analytics'
        ],
        cta: 'Go Pro',
        popular: true,
    },
    {
        name: 'Expert',
        price: 'R$349,90',
        period: '/mês',
        description: 'The ultimate toolkit for agencies and marketing experts.',
        features: [
            'Unlimited Social Networks',
            'Unlimited AI Posts & Advanced Features',
            'Unlimited Scheduling',
            'Competitor Analysis (3)',
            'PDF/CSV Report Exports',
            'Priority Support'
        ],
        cta: 'Become an Expert',
    },
];


export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image');
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Logo className="text-primary" />
          <span className="font-headline">ViralinkAI</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </nav>
      </header>
      
      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter mb-6">
            Amplify Your Social Presence with AI
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            ViralinkAI is the all-in-one platform to monitor social media, create posts with AI, automate messages, and analyze your competition. Save time, grow faster.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">Start 15-Day Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
          {heroImage && (
             <div className="mt-16 rounded-xl border-2 border-primary/20 shadow-2xl shadow-primary/20 overflow-hidden">
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  width={1200}
                  height={800}
                  data-ai-hint={heroImage.imageHint}
                  className="w-full"
                  priority
                />
             </div>
          )}
        </section>

        <section id="features" className="py-20 md:py-32 bg-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">A Smarter Way to Manage Social Media</h2>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                From content creation to performance analysis, ViralinkAI provides the tools you need to succeed.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col">
                    {feature.image && (
                        <CardContent className="p-0">
                            <Image
                                src={feature.image.imageUrl}
                                alt={feature.image.description}
                                width={600}
                                height={400}
                                data-ai-hint={feature.image.imageHint}
                                className="w-full h-48 object-cover rounded-t-lg"
                            />
                        </CardContent>
                    )}
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <feature.icon className="size-6 text-primary" />
                            <span className="font-headline text-2xl">{feature.title}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        <section id="pricing" className="py-20 md:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold">Find the Perfect Plan</h2>
                    <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                        Start for free and scale as you grow. All plans include a 15-day free trial.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 items-stretch">
                    {pricingTiers.map((tier) => (
                        <Card key={tier.name} className={`flex flex-col ${tier.popular ? 'border-primary shadow-2xl shadow-primary/20' : ''}`}>
                            {tier.popular && <div className="bg-primary text-primary-foreground text-center text-sm font-bold py-1 rounded-t-lg">Most Popular</div>}
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">{tier.name}</CardTitle>
                                <CardDescription>{tier.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="mb-6">
                                    <span className="text-4xl font-bold">{tier.price}</span>
                                    <span className="text-muted-foreground">{tier.period}</span>
                                </div>
                                <ul className="space-y-3">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className="size-5 text-green-500" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant={tier.popular ? 'default' : 'outline'} asChild>
                                    <Link href="/signup">{tier.cta}</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
      </main>

      <footer className="bg-card border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
                <Logo className="size-5" />
                <span className="font-headline font-semibold">ViralinkAI</span>
                <span className="text-muted-foreground">&copy; {new Date().getFullYear()}</span>
            </div>
            <div className="flex gap-4">
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
