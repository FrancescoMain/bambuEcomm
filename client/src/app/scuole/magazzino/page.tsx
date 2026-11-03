import type { Metadata } from "next";
import { Suspense } from "react";
import { MagazzinoPage } from "@/components/scuole/magazzino/MagazzinoPage";

export const metadata: Metadata = { title: "Magazzino · Libri scolastici" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MagazzinoPage />
    </Suspense>
  );
}
