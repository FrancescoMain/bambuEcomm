"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import ProductCard from "@/components/layout/ProductCard";
import { useCartActions } from "@/components/layout/CartProvider";
import { useLoading } from "@/components/layout/LoadingContext";
import productService from "@/api/productService";
import { removeFromCart, updateQuantity } from "@/redux/cartSlice";

// Tipi TypeScript per i prodotti e il carrello
interface CartItem {
  productId: number;
  titolo: string;
  prezzo: number;
  immagine?: string;
  quantity: number;
  cartItemId?: number;
}

interface Product {
  id: number | string;
  titolo: string;
  prezzo: number;
  immagine?: string;
  categoria?: { name: string }[];
}

const CartPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { setLoading } = useLoading();
  const { handleAddToCart } = useCartActions();

  // Stato del carrello
  const reduxCartItems = useSelector(
    (state: { cart: { items: CartItem[] } }) => state.cart.items
  );
  const [cartItems, setCartItems] = React.useState<CartItem[]>(reduxCartItems);
  const [relatedProducts, setRelatedProducts] = React.useState<Product[]>([]);

  // Sincronizzazione carrello
  React.useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      const cached =
        typeof window !== "undefined" ? localStorage.getItem("cart") : null;
      if (cached) {
        try {
          const items: CartItem[] = JSON.parse(cached);
          if (Array.isArray(items)) setCartItems(items);
        } catch {}
      } else {
        setCartItems([]);
      }
    } else {
      setCartItems(reduxCartItems);
    }
  }, [reduxCartItems]);

  // Aggiorna localStorage se non loggato
  React.useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token && cartItems) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems]);

  // Carica prodotti correlati
  React.useEffect(() => {
    const lastCat = localStorage.getItem("lastCategory");
    if (!lastCat) return;

    const lastCatId = parseInt(lastCat, 10);
    if (isNaN(lastCatId)) return;

    productService
      .getProductsByCategory(lastCatId, 1, 6)
      .then((res) => {
        const data: Product[] = res.products || [];
        setRelatedProducts(data);
      })
      .catch((error) => {
        console.error("Failed to fetch related products:", error);
      });
  }, []);

  // Calcoli carrello
  const subtotal = cartItems.reduce(
    (acc, item) => acc + Number(item.prezzo) * Number(item.quantity),
    0
  );
  const shippingThreshold = 50;
  const shippingCost = subtotal >= shippingThreshold ? 0 : 4.99;
  const total = subtotal + shippingCost;
  const isCartEmpty = !cartItems || cartItems.length === 0;
  const remainingForFreeShipping = Math.max(0, shippingThreshold - subtotal);

  // Gestione quantità
  const handleQuantityChange = async (
    productId: number,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;
    setLoading(true);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      dispatch(updateQuantity({ productId, quantity: newQuantity }));
    } else {
      const updatedItems = cartItems.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedItems);
    }
    setLoading(false);
  };

  // Rimozione prodotto
  const handleRemoveItem = async (productId: number) => {
    setLoading(true);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      dispatch(removeFromCart(productId));
    } else {
      const updatedItems = cartItems.filter(
        (item) => item.productId !== productId
      );
      setCartItems(updatedItems);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-[#51946b] to-[#3d7a57] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12 lg:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm mb-8">
            <button
              onClick={() => router.push("/")}
              className="text-gray-200 hover:text-white transition-colors"
            >
              Home
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-yellow-300 font-medium">Carrello</span>
          </nav>

          {/* Title and Progress */}
          <div className="text-center">
            <h1 className="text-3xl lg:text-5xl font-bold mb-6">
              🛒 Il tuo Carrello
            </h1>

            {/* Progress Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-center md:justify-between mb-4">
                {/* Mobile: Stack vertically, Desktop: Horizontal */}
                <div className="hidden md:flex items-center">
                  <div className="w-8 h-8 bg-white text-[#51946b] rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">Carrello</span>
                </div>
                <div className="hidden md:flex flex-1 h-1 bg-white/30 mx-4 rounded-full">
                  <div className="h-full bg-white rounded-full w-0"></div>
                </div>
                <div className="hidden md:flex items-center">
                  <div className="w-8 h-8 bg-white/30 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <span className="ml-2 text-sm opacity-70">Checkout</span>
                </div>
                <div className="hidden md:flex flex-1 h-1 bg-white/30 mx-4 rounded-full"></div>
                <div className="hidden md:flex items-center">
                  <div className="w-8 h-8 bg-white/30 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <span className="ml-2 text-sm opacity-70">Conferma</span>
                </div>

                {/* Mobile: Simple indicator */}
                <div className="md:hidden flex items-center space-x-2">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                  <span className="ml-3 text-sm font-medium">Passo 1 di 3</span>
                </div>
              </div>
            </div>
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

      {isCartEmpty ? (
        /* Empty Cart State */
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L6 5H4m3 8v6a1 1 0 001 1h8a1 1 0 001-1v-6m-2 2v4m-4-4v4"
                  />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Il tuo carrello è vuoto
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Scopri i nostri prodotti e aggiungi quello che ti piace!
              </p>

              <button
                onClick={() => router.push("/")}
                className="bg-[#51946b] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#3d7a57] transition-colors shadow-lg mb-8"
              >
                🛍️ Inizia lo Shopping
              </button>

              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  🔥 Categorie popolari:
                </h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  {["Libri", "Cancelleria", "Arte", "Zaini"].map((category) => (
                    <button
                      key={category}
                      onClick={() =>
                        router.push(
                          `/search?category=${encodeURIComponent(category)}`
                        )
                      }
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-[#51946b] hover:text-white transition-colors"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Cart with Items */
        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Cart Items */}
              <div className="lg:flex-1 lg:w-2/3 order-2 lg:order-1">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Prodotti nel Carrello
                    </h2>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <div
                        key={item.productId}
                        className="p-4 md:p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col gap-4">
                          {/* Mobile: Top row with image and info */}
                          <div className="flex gap-4">
                            {/* Product Image */}
                            <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                              <img
                                src={item.immagine || "/file.svg"}
                                alt={item.titolo}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                                {item.titolo}
                              </h3>
                              <p className="text-lg sm:text-xl font-bold text-[#51946b]">
                                €
                                {typeof item.prezzo === "number"
                                  ? item.prezzo.toFixed(2)
                                  : parseFloat(item.prezzo).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Mobile: Bottom row with controls and total */}
                          <div className="flex items-center justify-between">
                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.productId,
                                    item.quantity - 1
                                  )
                                }
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                              >
                                <svg
                                  className="w-3 h-3 sm:w-4 sm:h-4"
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
                              <span className="text-lg sm:text-xl font-semibold w-6 sm:w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.productId,
                                    item.quantity + 1
                                  )
                                }
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                              >
                                <svg
                                  className="w-3 h-3 sm:w-4 sm:h-4"
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

                            {/* Total Price and Remove */}
                            <div className="text-right">
                              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                                €{(item.prezzo * item.quantity).toFixed(2)}
                              </p>
                              <button
                                onClick={() => handleRemoveItem(item.productId)}
                                className="text-red-500 hover:text-red-700 text-xs sm:text-sm font-medium mt-1 transition-colors flex items-center gap-1"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M9 3v1H4v2h1v13a2 2 0 002 2h10a2 2 0 002-2V6h1V4h-5V3H9zM7 6h10v13H7V6zm2 2v9h2V8H9zm4 0v9h2V8h-2z" />
                                </svg>
                                Rimuovi
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:w-1/3 order-1 lg:order-2">
                <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 lg:sticky lg:top-24">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    📊 Riepilogo Ordine
                  </h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">Subtotale:</span>
                      <span className="font-semibold">
                        €{subtotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">Spedizione:</span>
                      <span className="font-semibold">
                        {shippingCost === 0
                          ? "Gratuita"
                          : `€${shippingCost.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between text-2xl font-bold">
                        <span>Totale:</span>
                        <span className="text-[#51946b]">
                          €{total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Free Shipping Progress */}
                  {remainingForFreeShipping > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">
                          🚚 Spedizione GRATUITA da €50!
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              (subtotal / shippingThreshold) * 100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-blue-700">
                        Ti mancano solo €{remainingForFreeShipping.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push("/checkout")}
                      className="w-full bg-[#51946b] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#3d7a57] transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      🎯 Procedi al Checkout
                    </button>

                    <button
                      onClick={() => router.push("/")}
                      className="w-full border-2 border-[#51946b] text-[#51946b] py-3 rounded-xl font-semibold hover:bg-[#51946b] hover:text-white transition-colors"
                    >
                      🛍️ Continua lo Shopping
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trust Signals */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                Spedizione Rapida
              </h3>
              <p className="text-gray-600 text-sm">Consegna in 3-5 giorni</p>
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
                Checkout Protetto
              </h3>
              <p className="text-gray-600 text-sm">SSL 256-bit</p>
            </div>

            <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📞</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                Assistenza Clienti
              </h3>
              <p className="text-gray-600 text-sm">Supporto dedicato</p>
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
                💡 Prodotti che potrebbero interessarti
              </h2>
              <p className="text-xl text-gray-600">
                Basati sui tuoi ultimi acquisti
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="flex gap-4 md:gap-6 pb-4">
                {relatedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="min-w-64 md:min-w-80 flex-shrink-0"
                  >
                    <ProductCard
                      product={{
                        id: String(product.id),
                        titolo: product.titolo,
                        prezzo:
                          typeof product.prezzo === "number"
                            ? product.prezzo
                            : parseFloat(product.prezzo as string) || 0,
                        immagine: product.immagine || "/file.svg",
                        categoria:
                          product.categoria?.[product.categoria.length - 1]
                            ?.name || "",
                      }}
                      isInCart={cartItems.some(
                        (item) => item.productId === Number(product.id)
                      )}
                      onAddToCart={async () => {
                        setLoading(true);
                        await handleAddToCart({
                          productId: Number(product.id),
                          titolo: product.titolo,
                          prezzo:
                            typeof product.prezzo === "number"
                              ? product.prezzo
                              : parseFloat(product.prezzo as string) || 0,
                          immagine: product.immagine || "",
                          quantity: 1,
                        });
                        setLoading(false);
                      }}
                      onClick={() => {
                        setLoading(true);
                        router.push(`/product/${product.id}`);
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

export default CartPage;
