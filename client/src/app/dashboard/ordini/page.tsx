import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersView } from "@/components/admin/ops/orders/OrdersView";

export const metadata: Metadata = { title: "Ordini" };

export default function OrdiniPage() {
  return (
    <Suspense fallback={null}>
      <OrdersView />
    </Suspense>
  );
}
