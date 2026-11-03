import type { Metadata } from "next";
import { Suspense } from "react";
import { UsatiPage } from "@/components/scuole/usati/UsatiPage";

export const metadata: Metadata = { title: "Usati · Libri scolastici" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <UsatiPage />
    </Suspense>
  );
}
