import type { Metadata } from "next";
import { CartPageClient } from "@/components/checkout/CartPageClient";
import { getSettings } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Carrello",
  robots: { index: false, follow: true },
};

export default async function CartPage() {
  const settings = await getSettings();
  return (
    <CartPageClient
      freeShippingThreshold={settings.spedizione.sogliaGratuita}
      pickup={settings.spedizione.ritiroInNegozio}
    />
  );
}
