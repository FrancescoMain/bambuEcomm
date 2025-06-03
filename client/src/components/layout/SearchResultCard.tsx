"use client";
import React from "react";
import Image from "next/image";

interface SearchResultCardProps {
  image: string;
  title: string;
  author: string;
  price: number;
  onAddToCart: () => void;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({
  image,
  title,
  author,
  price,
  onAddToCart,
}) => (
  <div className="flex flex-col gap-2 bg-white rounded-lg shadow p-3 h-full">
    <div
      className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-lg"
      style={{ backgroundImage: `url('${image}')` }}
    ></div>
    <div>
      <p className="text-[#0e1a13] text-base font-medium leading-normal truncate">
        {title}
      </p>
      <p className="text-[#51946b] text-sm font-normal leading-normal truncate">
        {author}
      </p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[#0e1a13] font-semibold text-base">
          € {price.toFixed(2)}
        </span>
        <button
          onClick={onAddToCart}
          className="flex items-center gap-1 px-3 py-1 rounded bg-[#e8f2ec] hover:bg-[#d2e7db] text-[#51946b] font-medium text-sm transition-colors"
        >
          <Image
            src="/add-cart-ecommerce-svgrepo-com.svg"
            alt="Aggiungi al carrello"
            width={20}
            height={20}
            className="inline-block"
            style={{ minWidth: 20, minHeight: 20 }}
          />
          Aggiungi
        </button>
      </div>
    </div>
  </div>
);

export default SearchResultCard;
