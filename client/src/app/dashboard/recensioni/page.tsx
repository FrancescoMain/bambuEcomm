import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewsView } from "@/components/admin/ops/reviews/ReviewsView";

export const metadata: Metadata = { title: "Recensioni" };

export default function RecensioniPage() {
  return (
    <Suspense fallback={null}>
      <ReviewsView />
    </Suspense>
  );
}
