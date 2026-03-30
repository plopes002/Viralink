// src/app/(app)/social-accounts/select-facebook-page/page.tsx
import { Suspense } from "react";
import SelectFacebookPageClient from "./SelectFacebookPageClient";

export default function SelectFacebookPagePage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-screen bg-[#050016] text-white p-6">
          <p className="text-sm text-[#9CA3AF]">Carregando páginas...</p>
        </section>
      }
    >
      <SelectFacebookPageClient />
    </Suspense>
  );
}