import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSuccess } from "@/components/checkout/CheckoutSuccess";

export const metadata: Metadata = {
  title: "Grazie per il tuo ordine",
  robots: { index: false, follow: false },
};

export default function SuccessPage() {
  return (
    <Suspense>
      <CheckoutSuccess />
    </Suspense>
  );
}
