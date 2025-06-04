import React from "react";
import ProductImportForm from "@/components/admin/ProductImportForm";

export default function ProductImportPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Importa Prodotti da Excel</h1>
      <ProductImportForm />
    </div>
  );
}
