import type { Metadata } from "next";
import { Suspense } from "react";
import { WithdrawalsView } from "@/components/admin/ops/withdrawals/WithdrawalsView";

export const metadata: Metadata = { title: "Recessi" };

export default function RecessiPage() {
  return (
    <Suspense fallback={null}>
      <WithdrawalsView />
    </Suspense>
  );
}
