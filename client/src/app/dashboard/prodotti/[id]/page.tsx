import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/catalog/editor/ProductEditor";

export const metadata: Metadata = { title: "Modifica prodotto" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (!Number.isInteger(productId) || productId <= 0) notFound();
  return <ProductEditor key={productId} productId={productId} />;
}
