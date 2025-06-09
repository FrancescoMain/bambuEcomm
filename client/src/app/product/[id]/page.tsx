"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import ProductCard from "@/components/layout/ProductCard";
import { useLoading } from "@/components/layout/LoadingContext";
import Header from "@/components/layout/Header";
import { useCartActions } from "@/components/layout/CartProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Product = {
  id: number;
  titolo: string;
  immagine?: string;
  prezzo: number | string;
  descrizione?: string;
  categoria?: { name: string }[];
  stock?: number;
  url?: string;
};

const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const productId = params?.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const { handleAddToCart } = useCartActions();
  const { setLoading } = useLoading();
  const router = useRouter();
  const categories = useSelector(
    (state: RootState) => state.category.categories
  );
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [cartSidebarOpen, setCartSidebarOpen] = useState(false);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const isInCart =
    product && cartItems.some((item) => item.productId === product.id);

  // Funzione per triggerare apertura sidebar carrello
  const openCartSidebar = () => {
    window.dispatchEvent(new CustomEvent("open-cart-sidebar"));
  };

  // Trova la categoria principale effettiva (id)
  const mainCategoryId = React.useMemo(() => {
    if (!product || !product.categoria || product.categoria.length === 0)
      return null;
    // Cerca la categoria effettiva tra quelle in redux
    const lastCatName = product.categoria[product.categoria.length - 1]?.name;
    const found = categories.find((cat) => cat.name === lastCatName);
    return found?.id || null;
  }, [product, categories]);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    axios
      .get(`${API_URL}/products/${productId}`)
      .then((res) => setProduct(res.data))
      .catch(() => setError("Prodotto non trovato"))
      .finally(() => setLoading(false));
  }, [productId, setLoading]);

  useEffect(() => {
    if (!mainCategoryId) return;
    axios
      .get(`${API_URL}/products`, {
        params: {
          categoryId: mainCategoryId,
          limit: 10,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      })
      .then((res) => {
        const data = res.data.data || res.data;
        setRelatedProducts(data.filter((p: Product) => p.id !== product?.id));
      });
  }, [mainCategoryId, product]);

  if (error || !product)
    return (
      <div className="p-8 text-red-500">{error || "Prodotto non trovato"}</div>
    );

  return (
    <div className="flex flex-1 justify-center py-5 px-2 md:px-10 bg-[#f8fbfa] min-h-screen">
      <div className="layout-content-container flex flex-col max-w-5xl w-full flex-1">
        {/* Bottone ritorna alla ricerca */}
        {mainCategoryId &&
          product.categoria &&
          product.categoria.length > 0 && (
            <div className="mb-2 px-2 md:px-4">
              <button
                className="inline-block mb-2 px-4 py-2 rounded bg-[#e8f2ec] text-[#0e1a13] font-bold hover:bg-[#d1e7db] transition"
                onClick={() => {
                  setLoading(true);
                  const catName =
                    product.categoria && product.categoria.length > 0
                      ? product.categoria[product.categoria.length - 1].name
                      : "";
                  router.push(
                    `/search?category=${encodeURIComponent(catName)}`
                  );
                }}
              >
                ← Ritorna alla ricerca
              </button>
            </div>
          )}
        <div className="flex flex-wrap gap-2 p-2 md:p-4">
          {/* Replace <a> with <Link> for navigation */}
          <Link
            className="text-[#51946b] text-base font-medium leading-normal"
            href="/"
            prefetch={false}
          >
            Home
          </Link>
          {product.categoria && product.categoria.length > 0 && (
            <>
              <span className="text-[#51946b] text-base font-medium leading-normal">
                /
              </span>
              <span className="text-[#51946b] text-base font-medium leading-normal">
                {product.categoria.map((cat, idx) => (
                  <span key={cat.name}>
                    {idx > 0 && " / "}
                    {cat.name}
                  </span>
                ))}
              </span>
            </>
          )}
          <span className="text-[#51946b] text-base font-medium leading-normal">
            /
          </span>
          <span className="text-[#0e1a13] text-base font-medium leading-normal">
            {product.titolo}
          </span>
        </div>
        <h1 className="text-[#0e1a13] text-[22px] font-bold leading-tight tracking-[-0.015em] px-2 md:px-4 text-left pb-3 pt-5">
          {product.titolo}
        </h1>
        <p className="text-[#0e1a13] text-base font-normal leading-normal pb-3 pt-1 px-2 md:px-4">
          {product.descrizione ? (
            <span dangerouslySetInnerHTML={{ __html: product.descrizione }} />
          ) : (
            "Nessuna descrizione disponibile."
          )}
        </p>
        <div className="flex w-full grow bg-[#f8fbfa] @container p-2 md:p-4">
          <div className="w-full gap-1 overflow-hidden bg-[#f8fbfa] rounded-lg flex">
            {/* Replace <img> with <Image> from next/image */}
            {product.immagine && (
              <Image
                src={product.immagine}
                alt={product.titolo}
                width={600}
                height={320}
                className="w-full h-auto object-contain rounded-lg bg-white"
                style={{ maxHeight: 320 }}
                priority
              />
            )}
          </div>
        </div>

        <div className="flex px-2 md:px-4 py-3 justify-center">
          {isInCart ? (
            <button
              className="flex min-w-[120px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-[#e8f2ec] text-[#0e1a13] text-base font-bold leading-normal tracking-[0.015em] shadow-md hover:bg-[#d1e7db] transition-colors"
              onClick={openCartSidebar}
            >
              Vai al carrello
            </button>
          ) : (
            <button
              className="flex min-w-[120px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-[#39e079] text-[#0e1a13] text-base font-bold leading-normal tracking-[0.015em] shadow-md hover:bg-[#2fc76b] transition-colors"
              onClick={async () => {
                if (!product) return;
                await handleAddToCart({
                  productId: product.id,
                  titolo: product.titolo,
                  prezzo:
                    typeof product.prezzo === "number"
                      ? product.prezzo
                      : parseFloat(product.prezzo as string) || 0,
                  immagine: product.immagine || "",
                  quantity: 1,
                });
                openCartSidebar();
              }}
            >
              <span className="truncate">Aggiungi al Carrello</span>
            </button>
          )}
        </div>
        {/* Cart Sidebar Overlay (solo su questa pagina, mobile/desktop) */}
        {cartSidebarOpen && (
          <Header
            showCartSidebar={cartSidebarOpen}
            setShowCartSidebar={setCartSidebarOpen}
          />
        )}
        {/* Prodotti correlati */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 px-0">
            <h2 className="text-lg font-bold mb-4 text-[#0e1a13] px-2 md:px-4">
              Altri prodotti nella stessa categoria
            </h2>
            <div className="flex overflow-x-auto no-scrollbar">
              <div className="flex items-stretch gap-3 p-2 md:p-4">
                {relatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      ...p,
                      id: String(p.id),
                      prezzo:
                        typeof p.prezzo === "number"
                          ? p.prezzo
                          : parseFloat(p.prezzo as string) || 0,
                      immagine: p.immagine || "",
                      categoria:
                        p.categoria?.[p.categoria.length - 1]?.name || "",
                    }}
                    onAddToCart={() =>
                      handleAddToCart({
                        productId: p.id,
                        titolo: p.titolo,
                        prezzo:
                          typeof p.prezzo === "number"
                            ? p.prezzo
                            : parseFloat(p.prezzo as string) || 0,
                        immagine: p.immagine || "",
                        quantity: 1,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
