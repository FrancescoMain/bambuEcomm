import React from "react";
import { Product } from "./types";
import { FiEdit, FiTrash2 } from "react-icons/fi";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

const StockBadge: React.FC<{ stock: number }> = ({ stock }) => {
  if (stock > 10) {
    return (
      <span className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
        Disponibile
      </span>
    );
  }
  if (stock > 0) {
    return (
      <span className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
        In esaurimento
      </span>
    );
  }
  return (
    <span className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
      Esaurito
    </span>
  );
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
}) => {
  const imageUrl = product.immagine || "/bambu-logo.jpg"; // Fallback image

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col justify-between transition-transform transform hover:-translate-y-1">
      <div className="relative">
        <img
          src={imageUrl}
          alt={product.titolo}
          className="w-full h-48 object-cover"
        />
        <StockBadge stock={product.stock ?? 0} />
      </div>
      <div className="p-4 flex-grow">
        <h3
          className="font-bold text-lg text-gray-800 truncate"
          title={product.titolo}
        >
          {product.titolo}
        </h3>
        <p className="text-xl font-semibold text-gray-900 mt-2">
          {new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
          }).format(product.prezzo)}
        </p>
      </div>
      <div className="p-4 bg-gray-50 border-t grid grid-cols-2 gap-2">
        <button
          onClick={() => onEdit(product)}
          className="flex items-center justify-center px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
        >
          <FiEdit className="mr-2" /> Modifica
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="flex items-center justify-center px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors"
        >
          <FiTrash2 className="mr-2" /> Elimina
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
