import type { Metadata } from "next";
import { BrandsPage } from "@/components/admin/catalog/brands/BrandsPage";

export const metadata: Metadata = { title: "Marche" };

export default function Page() {
  return <BrandsPage />;
}
