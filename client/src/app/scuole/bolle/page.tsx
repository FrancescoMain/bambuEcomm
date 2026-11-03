import type { Metadata } from "next";
import { Suspense } from "react";
import { BollePage } from "@/components/scuole/bolle/BollePage";

export const metadata: Metadata = { title: "Bolle · Libri scolastici" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BollePage />
    </Suspense>
  );
}
