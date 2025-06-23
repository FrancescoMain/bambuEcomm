"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import ProductCard from "@/components/layout/ProductCard";
import { useLoading } from "@/components/layout/LoadingContext";
import { useCartActions } from "@/components/layout/CartProvider";
import productDetailService from "@/api/productDetailService";

type Product = {
  id: number;
  titolo: string;
  immagine?: string;
  prezzo: number | string;
  descrizione?: string;
  categoria?: { name: string }[];
  stock?: number;
  url?: string;
  varianti?: {
    id: number;
    nome: string;
    productId: number;
    valori: {
      id: number;
      nome: string;
      immagine?: string;
      typeId: number;
    }[];
  }[];
};

const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const productId = params?.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [selectedVariants, setSelectedVariants] = useState<{
    [variantTypeId: number]: any;
  }>({});
  const [currentImage, setCurrentImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const { handleAddToCart } = useCartActions();
  const { setLoading } = useLoading();
  const router = useRouter();

  const categories = useSelector(
    (state: RootState) => state.category.categories
  );
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const cartItems = useSelector((state: RootState) => state.cart.items);

  const isInCart =
    product && cartItems.some((item) => item.productId === product.id);

  // Find main category ID for related products
  const mainCategoryId = React.useMemo(() => {
    if (!product || !product.categoria || product.categoria.length === 0)
      return null;
    const lastCatName = product.categoria[product.categoria.length - 1]?.name;
    const found = categories.find((cat) => cat.name === lastCatName);
    return found?.id || null;
  }, [product, categories]);
  // Load product data
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    productDetailService
      .getProductById(productId.toString())
      .then((product) => {
        setProduct(product);

        // Inizializza varianti selezionate con la prima variante di ogni tipo
        if (product.varianti && product.varianti.length > 0) {
          const initialVariants: { [variantTypeId: number]: any } = {};
          product.varianti.forEach((variantType: any) => {
            if (variantType.valori && variantType.valori.length > 0) {
              initialVariants[variantType.id] = variantType.valori[0];
            }
          });
          setSelectedVariants(initialVariants);

          // Imposta l'immagine iniziale dalla prima variante o dall'immagine principale
          const firstVariantWithImage = product.varianti
            .flatMap((v: any) => v.valori)
            .find((valor: any) => valor.immagine);

          setCurrentImage(
            firstVariantWithImage?.immagine || product.immagine || ""
          );
        } else {
          setCurrentImage(product.immagine || "");
        }
      })
      .catch(() => setError("Prodotto non trovato"))
      .finally(() => setLoading(false));
  }, [productId, setLoading]);

  // Handle variant selection
  const handleVariantChange = (variantTypeId: number, selectedValue: any) => {
    const newSelectedVariants = {
      ...selectedVariants,
      [variantTypeId]: selectedValue,
    };
    setSelectedVariants(newSelectedVariants);

    // Aggiorna l'immagine se la variante selezionata ha un'immagine
    if (selectedValue.immagine) {
      setCurrentImage(selectedValue.immagine);
    } else {
      // Fallback all'immagine principale del prodotto se la variante non ha immagine
      setCurrentImage(product?.immagine || "");
    }
  };

  // Load related products
  useEffect(() => {
    if (!mainCategoryId) return;
    productDetailService
      .getRelatedProductsByCategory(mainCategoryId, 6, product?.id)
      .then((products) => setRelatedProducts(products));
  }, [mainCategoryId, product]);

  // Handle add to cart
  const handleAddToCartClick = async () => {
    if (!product) return;
    setLoading(true);
    await handleAddToCart({
      productId: product.id,
      titolo: product.titolo,
      prezzo:
        typeof product.prezzo === "number"
          ? product.prezzo
          : parseFloat(product.prezzo as string) || 0,
      immagine: product.immagine || "",
      quantity,
    });
    setLoading(false);
  };

  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.titolo,
        url: window.location.href,
      });
    }
  };

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Prodotto non trovato
          </h2>
          <p className="text-gray-600 mb-8">
            Il prodotto che stai cercando non esiste o è stato rimosso.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-[#51946b] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#3d7a57] transition-colors"
          >
            Torna alla Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section with Breadcrumb */}
      <section className="relative bg-gradient-to-r from-[#51946b] to-[#3d7a57] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-12 lg:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm mb-8">
            <button
              onClick={() => router.push("/")}
              className="text-gray-200 hover:text-white transition-colors"
            >
              Home
            </button>
            <span className="text-gray-300">/</span>
            {product.categoria && product.categoria.length > 0 && (
              <>
                <button
                  onClick={() => {
                    const catName = product.categoria?.[0]?.name || "";
                    router.push(
                      `/search?category=${encodeURIComponent(catName)}`
                    );
                  }}
                  className="text-gray-200 hover:text-white transition-colors"
                >
                  {product.categoria.map((cat, idx) => (
                    <span key={cat.name}>
                      {idx > 0 && " / "}
                      {cat.name}
                    </span>
                  ))}
                </button>
                <span className="text-gray-300">/</span>
              </>
            )}
            <span className="text-yellow-300 font-medium">
              {product.titolo}
            </span>
          </nav>

          {/* Hero Title */}
          <div className="text-center">
            <h1 className="text-3xl lg:text-5xl font-bold mb-4">
              {product.titolo}
            </h1>
            {product.categoria && product.categoria.length > 0 && (
              <div className="inline-flex items-center bg-white/20 rounded-full px-4 py-2 backdrop-blur-sm">
                <span className="mr-2">🏷️</span>
                <span className="font-medium">{product.categoria[0].name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-12 lg:h-20">
            <path
              fill="rgb(249 250 251)"
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,69.3C960,85,1056,107,1152,112C1248,117,1344,107,1392,101.3L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Main Product Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {" "}
            {/* Product Image */}
            <div className="bg-white rounded-2xl shadow-lg p-8 flex justify-center items-center">
              {currentImage ? (
                <div className="relative group cursor-zoom-in">
                  <Image
                    src={currentImage}
                    alt={product.titolo}
                    width={500}
                    height={500}
                    className="w-full h-auto object-contain rounded-xl transition-transform group-hover:scale-105"
                    priority
                  />
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>
            {/* Product Info */}
            <div className="space-y-8">
              {/* Price and Stock */}
              <div>
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  €
                  {typeof product.prezzo === "number"
                    ? product.prezzo.toFixed(2)
                    : parseFloat((product.prezzo as string) || "0").toFixed(2)}
                </div>
                <div className="flex items-center space-x-4">
                  {product.stock && product.stock > 0 ? (
                    <span className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Disponibile
                    </span>
                  ) : (
                    <span className="inline-flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Disponibilità limitata
                    </span>
                  )}
                </div>
              </div>{" "}
              {/* Product Variants */}
              {product.varianti && product.varianti.length > 0 && (
                <div className="space-y-6">
                  {product.varianti.map((variantType) => (
                    <div key={variantType.id}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {variantType.nome}:
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {variantType.valori.map((valor) => (
                          <button
                            key={valor.id}
                            onClick={() =>
                              handleVariantChange(variantType.id, valor)
                            }
                            className={`relative border-2 rounded-lg p-3 transition-all min-w-[100px] ${
                              selectedVariants[variantType.id]?.id === valor.id
                                ? "border-[#51946b] bg-[#51946b]/10 scale-105"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {valor.immagine && (
                              <div className="mb-2">
                                <Image
                                  src={valor.immagine}
                                  alt={valor.nome}
                                  width={60}
                                  height={60}
                                  className="w-full h-12 object-cover rounded mx-auto"
                                />
                              </div>
                            )}
                            <span className="text-sm font-medium block text-center">
                              {valor.nome}
                            </span>
                            {selectedVariants[variantType.id]?.id ===
                              valor.id && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-[#51946b] rounded-full flex items-center justify-center">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Selezionato:{" "}
                        {selectedVariants[variantType.id]?.nome ||
                          "Nessuna selezione"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {/* Quantity and Actions */}
              <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
                {/* Quantity Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Quantità:
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    </button>
                    <span className="text-xl font-semibold w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleAddToCartClick}
                    className="w-full bg-[#51946b] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#3d7a57] transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    🛒 Aggiungi al Carrello
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full border-2 border-[#51946b] text-[#51946b] py-3 rounded-xl font-semibold hover:bg-[#51946b] hover:text-white transition-colors"
                  >
                    📤 Condividi Prodotto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Description */}
      {product.descrizione && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                📄 Descrizione Prodotto
              </h2>
              <div
                className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.descrizione }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Shipping Info */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">📦</span>
              Spedizione & Tempi di Consegna
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                  <h3 className="font-bold text-green-800">
                    Prodotto in Stock
                  </h3>
                </div>{" "}
                <ul className="space-y-2 text-green-700">
                  <li>• Spedizione entro 48 ore dall&apos;ordine</li>
                  <li>• Consegna stimata: 3-5 giorni lavorativi</li>
                  <li>• Tracciamento incluso</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
                  <h3 className="font-bold text-yellow-800">
                    Prodotto non in Stock
                  </h3>
                </div>{" "}
                <ul className="space-y-2 text-yellow-700">
                  <li>• Spedizione entro 96 ore dall&apos;ordine</li>
                  <li>• Consegna stimata: 5-7 giorni lavorativi</li>
                  <li>• Ti avviseremo quando sarà pronto</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-600 text-center">
                💰 I costi di spedizione verranno calcolati al checkout in base
                alla destinazione
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                Spedizione Rapida
              </h3>
              <p className="text-gray-600 text-sm">Consegna veloce e sicura</p>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Pagamento Sicuro</h3>
              <p className="text-gray-600 text-sm">Transazioni protette</p>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                Acquisto Protetto
              </h3>
              <p className="text-gray-600 text-sm">Garanzia sulla qualità</p>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">↩️</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Reso Facile</h3>
              <p className="text-gray-600 text-sm">
                30 giorni per cambiare idea
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                💡 Potrebbe interessarti anche
              </h2>
              <p className="text-xl text-gray-600">
                Altri prodotti dalla stessa categoria
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="flex gap-6 pb-4">
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct.id} className="min-w-80">
                    <ProductCard
                      product={{
                        id: String(relatedProduct.id),
                        titolo: relatedProduct.titolo,
                        prezzo:
                          typeof relatedProduct.prezzo === "number"
                            ? relatedProduct.prezzo
                            : parseFloat(relatedProduct.prezzo as string) || 0,
                        immagine: relatedProduct.immagine || "/file.svg",
                        categoria:
                          relatedProduct.categoria?.[
                            relatedProduct.categoria.length - 1
                          ]?.name || "",
                      }}
                      isInCart={cartItems.some(
                        (item) => item.productId === relatedProduct.id
                      )}
                      onAddToCart={async () => {
                        setLoading(true);
                        await handleAddToCart({
                          productId: relatedProduct.id,
                          titolo: relatedProduct.titolo,
                          prezzo:
                            typeof relatedProduct.prezzo === "number"
                              ? relatedProduct.prezzo
                              : parseFloat(relatedProduct.prezzo as string) ||
                                0,
                          immagine: relatedProduct.immagine || "",
                          quantity: 1,
                        });
                        setLoading(false);
                      }}
                      onClick={() => {
                        setLoading(true);
                        router.push(`/product/${relatedProduct.id}`);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
