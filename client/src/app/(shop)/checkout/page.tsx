import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { getSettings } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <Suspense>
      <CheckoutClient settings={settings} />
    </Suspense>
  );
}
