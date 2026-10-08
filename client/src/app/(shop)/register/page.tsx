import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/account/AuthShell";
import { RegisterForm } from "@/components/account/RegisterForm";

export const metadata: Metadata = {
  title: "Crea un account",
  description: "Registrati su Cartoleria Bambù: ordini, tracking e preferiti sempre con te.",
  alternates: { canonical: "/register" },
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return (
    <AuthShell title="Crea il tuo account" subtitle="Bastano un minuto e un'email. Poi ordini, tracking e preferiti sono sempre a portata di mano.">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
