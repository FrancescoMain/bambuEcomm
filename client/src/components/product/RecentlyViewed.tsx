"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { useRecentlyViewed } from "@/store/wishlist";
import type { ListProduct, Paginated } from "@/lib/types";
import { ProductCarousel } from "@/components/shop/ProductCarousel";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** "Visti di recente" (salvati nel browser), escluso il prodotto corrente */
export function RecentlyViewed({ excludeId, title = "Visti di recente" }: { excludeId?: number; title?: string }) {
  const ids = useRecentlyViewed((s) => s.ids);
  const [products, setProducts] = useState<ListProduct[]>([]);
  const wanted = ids.filter((id) => id !== excludeId).slice(0, 10);
  const key = wanted.join(",");

  useEffect(() => {
    if (!key) return;
    api<Paginated<ListProduct>>("/products", { auth: false, query: { ids: key, limit: 10 } })
      .then((res) => {
        const order = key.split(",").map(Number);
        setProducts([...res.data].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)));
      })
      .catch(() => setProducts([]));
  }, [key]);

  if (!products.length) return null;
  return (
    <section>
      <SectionHeading title={title} accent="bg-paper-line" />
      <ProductCarousel products={products} />
    </section>
  );
}
