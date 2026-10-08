import type { Metadata } from "next";
import { Suspense } from "react";
import { UnsubscribeForm } from "@/components/forms/UnsubscribeForm";
import { Skeleton } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Disiscrizione dalla newsletter",
  description: "Annulla l'iscrizione alla newsletter di Cartoleria Bambù.",
  alternates: { canonical: "/newsletter/disiscrizione" },
  robots: { index: false, follow: true },
};

export default function UnsubscribePage() {
  return (
    <div className="bg-paper-warm bg-confetti">
      <div className="container py-12 sm:py-20">
        <div className="mx-auto max-w-xl rounded-3xl border border-paper-line bg-white p-6 shadow-card sm:p-10">
          <Suspense fallback={<Skeleton className="h-80 rounded-2xl" />}>
            <UnsubscribeForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
