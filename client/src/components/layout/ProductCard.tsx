"use client";

import React from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/redux/cartSlice";

// Update product type to include categoria as string | undefined
interface ProductCardProps {
  product: {
    id: string;
    titolo: string;
    prezzo: number;
    immagine: string;
    categoria?: string;
    [key: string]: unknown;
  };
  onAddToCart: (product: ProductCardProps["product"]) => void;
  isInCart?: boolean;
}

const ProductCard = ({
  product,
  onAddToCart,
  isInCart: isInCartProp,
}: ProductCardProps) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: any) => state.cart.items);
  const isInCart =
    typeof isInCartProp === "boolean"
      ? isInCartProp
      : product.id &&
        cartItems.some((item: any) => item.productId === product.id);

  // Funzione per triggerare apertura sidebar carrello
  const openCartSidebar = () => {
    window.dispatchEvent(new CustomEvent("open-cart-sidebar"));
  };

  return (
    <Link
      href={product.id ? `/product/${product.id}` : "#"}
      className="flex flex-1 flex-col gap-2 rounded-lg min-w-[160px] max-w-[200px] bg-white shadow-sm border border-[#e8f2ec] hover:shadow-md transition-shadow"
      prefetch={false}
      tabIndex={0}
      aria-label={product.titolo}
      onClick={() => {}}
    >
      <div
        className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-t-lg"
        style={{ backgroundImage: `url('${product.immagine}')` }}
      ></div>
      <div className="px-3 pb-2 flex flex-col gap-1">
        <p className="text-[#0e1a13] text-base font-medium leading-normal truncate">
          {product.titolo}
        </p>
        <p className="text-[#51946b] text-xs font-normal leading-normal truncate">
          {typeof product.categoria === "string" ? product.categoria : null}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#0e1a13] text-sm font-bold">
            {typeof product.prezzo === "number"
              ? `€ ${product.prezzo.toFixed(2)}`
              : `€ ${(
                  parseFloat(product.prezzo as unknown as string) || 0
                ).toFixed(2)}`}
          </span>
          {isInCart ? (
            <button
              className="ml-2 p-2 bg-[#e8f2ec] text-[#0e1a13] text-xs rounded-full flex items-center justify-center font-bold opacity-60 cursor-not-allowed"
              type="button"
              aria-label="Già nel carrello"
              disabled
            >
              Già nel carrello
            </button>
          ) : (
            <button
              className="ml-2 p-2 bg-[#51946b] hover:bg-[#417a57] text-white text-xs rounded-full transition-colors flex items-center justify-center"
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
                width="18"
                height="18"
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
