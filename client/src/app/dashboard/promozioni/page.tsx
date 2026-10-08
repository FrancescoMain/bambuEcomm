import type { Metadata } from "next";
import { Suspense } from "react";
import { PromotionsPage } from "@/components/admin/catalog/promotions/PromotionsPage";
import { Skeleton } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Sconti e coupon" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <PromotionsPage />
    </Suspense>
  );
}
