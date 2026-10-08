import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/account/AuthShell";
import { LoginForm } from "@/components/account/LoginForm";

export const metadata: Metadata = {
  title: "Accedi",
  description: "Accedi al tuo account Cartoleria Bambù per seguire ordini, preferiti e spedizioni.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <AuthShell title="Bentornato!" subtitle="Accedi per seguire i tuoi ordini, ritrovare i preferiti e completare gli acquisti più in fretta.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
