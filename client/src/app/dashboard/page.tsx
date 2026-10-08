import type { Metadata } from "next";
import { OverviewPage } from "@/components/admin/catalog/overview/OverviewPage";

export const metadata: Metadata = { title: "Riepilogo" };

export default function Page() {
  return <OverviewPage />;
}
