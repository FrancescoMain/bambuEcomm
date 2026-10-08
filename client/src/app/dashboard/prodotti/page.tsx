import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsPage } from "@/components/admin/catalog/products/ProductsPage";
import { Skeleton } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Prodotti" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <ProductsPage />
    </Suspense>
  );
}
