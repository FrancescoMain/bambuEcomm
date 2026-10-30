import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdiniPage } from "@/components/scuole/ordini/OrdiniPage";

export const metadata: Metadata = { title: "Ordini · Libri scolastici" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OrdiniPage />
    </Suspense>
  );
}
