import type { Metadata } from "next";
import { OrdersList } from "@/components/account/OrdersList";
import { getSettings } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "I miei ordini",
  description: "Stato, tracking e dettagli dei tuoi ordini su Cartoleria Bambù.",
  alternates: { canonical: "/account/ordini" },
};

export default async function OrdersPage() {
  const { contatti, resi } = await getSettings();
  return (
    <OrdersList
      whatsapp={contatti.whatsapp}
      storeAddress={`${contatti.indirizzo}, ${contatti.citta}`}
      giorniReso={resi.giorni}
    />
  );
}
