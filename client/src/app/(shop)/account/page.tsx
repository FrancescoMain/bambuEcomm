import type { Metadata } from "next";
import { AccountProfile } from "@/components/account/AccountProfile";

export const metadata: Metadata = {
  title: "Il mio account",
  description: "Gestisci i tuoi dati, la password, gli ordini e i preferiti su Cartoleria Bambù.",
  alternates: { canonical: "/account" },
};

export default function AccountPage() {
  return <AccountProfile />;
}
