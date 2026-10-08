import type { Metadata } from "next";
import { CategoriesPage } from "@/components/admin/catalog/categories/CategoriesPage";

export const metadata: Metadata = { title: "Categorie" };

export default function Page() {
  return <CategoriesPage />;
}
