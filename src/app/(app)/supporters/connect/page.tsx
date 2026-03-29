// src/app/(app)/supporters/connect/page.tsx
import { Suspense } from "react";
import SupporterConnectPageClient from "./SupporterConnectPageClient";

export default function SupporterConnectPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-screen bg-[#050016] text-white p-6">
          <p className="text-sm text-[#9CA3AF]">Carregando...</p>
        </section>
      }
    >
      <SupporterConnectPageClient />
    </Suspense>
  );
}