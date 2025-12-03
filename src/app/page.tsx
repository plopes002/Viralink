'use client';
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturesSection from "@/components/FeaturesSection";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-vbg text-white">
      <Header />
      <main className="flex-grow">
        <Hero />
        <FeaturesSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
