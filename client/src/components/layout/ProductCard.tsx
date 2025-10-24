"use client";

import React from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/redux/cartSlice";
import { RootState } from "@/redux/store";

// Tipi locali per evitare errori di import
interface CartItem {
  productId: number;
  titolo: string;
  prezzo: number;
  immagine?: string;
  quantity: number;
  cartItemId?: number;
}

// Update product type to include categoria as string | undefined
interface ProductCardProps {
  product: {
    id: string;
    titolo: string;
    prezzo: number;
    immagine: string;
    categoria?: string;
    available?: boolean;
    [key: string]: unknown;
  };
  onAddToCart: (product: ProductCardProps["product"]) => void;
  isInCart?: boolean;
  onClick?: () => void;
}

const ProductCard = ({
  product,
  onAddToCart,
  isInCart: isInCartProp,
  onClick,
}: ProductCardProps) => {
  const dispatch = useDispatch();
  const cartItems = useSelector(
    (state: { cart: { items: CartItem[] } }) => state.cart.items
  );
  const isInCart =
    typeof isInCartProp === "boolean"
      ? isInCartProp
      : product.id &&
        cartItems.some(
          (item: CartItem) => Number(item.productId) === Number(product.id)
        );

  // Funzione per triggerare apertura sidebar carrello
  const openCartSidebar = () => {
    window.dispatchEvent(new CustomEvent("open-cart-sidebar"));
  };

  return (
    <Link
      href={product.id ? `/product/${product.id}` : "#"}
      className="flex w-full h-full flex-col rounded-lg bg-white shadow-sm border border-[#e8f2ec] hover:shadow-md transition-shadow overflow-hidden"
      prefetch={false}
      tabIndex={0}
      aria-label={product.titolo}
      onClick={onClick}
    >
      <div
        className="w-full bg-center bg-no-repeat bg-cover flex-shrink-0 rounded-t-lg aspect-card-image"
        style={{ backgroundImage: `url('${product.immagine}')` }}
      ></div>
      <div className="p-4 flex flex-col flex-1 min-h-0 justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-[#0e1a13] text-sm font-medium leading-tight line-clamp-2">
            {product.titolo}
          </p>
          <p className="text-[#51946b] text-xs font-normal leading-normal truncate">
            {typeof product.categoria === "string" ? product.categoria : null}
          </p>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[#0e1a13] text-sm font-bold">
            {typeof product.prezzo === "number"
              ? `€ ${product.prezzo.toFixed(2)}`
              : `€ ${(
                  parseFloat(product.prezzo as unknown as string) || 0
                ).toFixed(2)}`}
          </span>
          {product.available === false ? (
            <button
              className="ml-2 px-2 py-1 bg-gray-300 text-gray-600 text-xs rounded-lg flex items-center justify-center font-medium cursor-not-allowed"
              type="button"
              aria-label="Non disponibile"
              disabled
            >
              Non disponibile
            </button>
          ) : isInCart ? (
            <button
              className="ml-2 px-2 py-1 bg-[#e8f2ec] text-[#0e1a13] text-xs rounded-lg flex items-center justify-center font-medium opacity-60 cursor-not-allowed"
              type="button"
              aria-label="Già nel carrello"
              disabled
            >
              Nel carrello
            </button>
          ) : (
            <button
              className="ml-2 p-2 bg-[#51946b] hover:bg-[#417a57] text-white text-xs rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart({
                  ...product,
                  id: product.id,
                  titolo: product.titolo,
                  prezzo:
                    typeof product.prezzo === "number"
                      ? product.prezzo
                      : parseFloat(product.prezzo as unknown as string) || 0,
                  immagine: product.immagine,
                  quantity: 1,
                });
                openCartSidebar();
              }}
              type="button"
              aria-label="Aggiungi al carrello"
            >
              {/* Custom SVG icon from public/add-cart-ecommerce-svgrepo-com.svg */}
              <svg
                fill="#fff"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12.2,9h1.6V6.8H16V5.2H13.8V3H12.2V5.2H10V6.8h2.2ZM20,5v5.5L7.45,12.72,5,3H1.25a1,1,0,0,0,0,2H3.47L6.7,18H20V16H8.26l-.33-1.33L22,12.18V5ZM7,19a1.5,1.5,0,1,0,1.5,1.5A1.5,1.5,0,0,0,7,19Zm12,0a1.5,1.5,0,1,0,1.5,1.5A1.5,1.5,0,0,0,19,19Z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
