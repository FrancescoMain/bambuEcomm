"use client";
import React from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/redux/cartSlice";

// Update product type to include autore as string | undefined
interface SearchResultCardProps {
  product: {
    id: string;
    titolo: string;
    prezzo: number;
    immagine: string;
    categoria?: string;
    autore?: string;
    [key: string]: unknown;
  };
  onClick: (id: string) => void;
  onAddToCart: (product: any) => void; // <-- add this prop
}

const SearchResultCard = ({
  product,
  onClick,
  onAddToCart,
}: SearchResultCardProps) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: any) => state.cart.items);
  const isInCart =
    product.id && cartItems.some((item: any) => item.productId === product.id);

  // Funzione per triggerare apertura sidebar carrello
  const openCartSidebar = () => {
    window.dispatchEvent(new CustomEvent("open-cart-sidebar"));
  };

  return (
    <div className="flex flex-col gap-2 bg-white rounded-lg shadow p-3 h-full">
      <div
        className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-lg"
        style={{ backgroundImage: `url('${product.immagine}')` }}
      ></div>
      <div>
        <p className="text-[#0e1a13] text-base font-medium leading-normal truncate">
          {product.titolo}
        </p>
        <p className="text-[#51946b] text-sm font-normal leading-normal truncate">
          {typeof product.autore === "string" ? product.autore : null}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#0e1a13] font-semibold text-base">
            €{" "}
            {typeof product.prezzo === "number"
              ? product.prezzo.toFixed(2)
              : Number(product.prezzo).toFixed(2)}
          </span>
          {isInCart ? (
            <button
              className="ml-2 p-2 bg-[#e8f2ec] hover:bg-[#d1e7db] text-[#0e1a13] text-xs rounded-full transition-colors flex items-center justify-center font-bold"
              type="button"
              aria-label="Vai al carrello"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openCartSidebar();
              }}
            >
              Vai al carrello
            </button>
          ) : (
            <button
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
                      : Number(product.prezzo),
                  immagine: product.immagine,
                  quantity: 1,
                });
                openCartSidebar();
              }}
              className="ml-2 p-2 bg-[#51946b] hover:bg-[#417a57] text-white text-xs rounded-full transition-colors flex items-center justify-center"
              type="button"
              aria-label="Aggiungi al carrello"
            >
              <Image
                src="/add-cart-ecommerce-svgrepo-com.svg"
                alt="Aggiungi al carrello"
                width={18}
                height={18}
                className="inline-block"
                style={{
                  minWidth: 18,
                  minHeight: 18,
                  filter: "invert(1) brightness(2)",
                }}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResultCard;
