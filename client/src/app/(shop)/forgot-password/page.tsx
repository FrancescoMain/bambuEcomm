import type { Metadata } from "next";
import { AuthShell } from "@/components/account/AuthShell";
import { ForgotPasswordForm } from "@/components/account/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Password dimenticata",
  description: "Reimposta la password del tuo account Cartoleria Bambù.",
  alternates: { canonical: "/forgot-password" },
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      aside="recover"
      title="Password dimenticata?"
      subtitle="Capita a tutti. Inserisci l'email del tuo account: ti invieremo un link per sceglierne una nuova."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
