import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientiPage } from "@/components/scuole/clienti/ClientiPage";

export const metadata: Metadata = { title: "Clienti · Libri scolastici" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ClientiPage />
    </Suspense>
  );
}
