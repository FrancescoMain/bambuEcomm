import type { Metadata } from "next";
import { ImportProducts } from "@/components/admin/catalog/import/ImportProducts";

export const metadata: Metadata = { title: "Importa prodotti" };

export default function Page() {
  return <ImportProducts />;
}
