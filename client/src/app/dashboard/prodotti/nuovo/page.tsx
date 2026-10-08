import type { Metadata } from "next";
import { ProductEditor } from "@/components/admin/catalog/editor/ProductEditor";

export const metadata: Metadata = { title: "Nuovo prodotto" };

export default function Page() {
  return <ProductEditor />;
}
