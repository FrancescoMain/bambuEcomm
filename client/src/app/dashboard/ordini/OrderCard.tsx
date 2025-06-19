import React from "react";
import { Order } from "./OrderList"; // Importo l'interfaccia dal componente principale

interface OrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
}

const getStatusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
    case "spedito":
      return "bg-green-100 text-green-800";
    case "processing":
    case "in lavorazione":
      return "bg-yellow-100 text-yellow-800";
    case "pending":
      return "bg-blue-100 text-blue-800";
    case "cancelled":
    case "annullato":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const OrderCard: React.FC<OrderCardProps> = ({ order, onViewDetails }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg text-gray-800">
            Ordine #{order.id}
          </h3>
          <p className="text-sm text-gray-600">{order.customerName}</p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
            order.status
          )}`}
        >
          {order.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-4">
        <div>
          <p className="font-semibold">Data</p>
          <p>{new Date(order.createdAt).toLocaleDateString("it-IT")}</p>
        </div>
        <div>
          <p className="font-semibold">Totale</p>
          <p>
            {new Intl.NumberFormat("it-IT", {
              style: "currency",
              currency: "EUR",
            }).format(order.total)}
          </p>
        </div>
      </div>
      <button
        onClick={() => onViewDetails(order)}
        className="w-full bg-[#51946b] text-white py-2 rounded-lg hover:bg-opacity-90 transition-colors duration-200"
      >
        Vedi Dettagli
      </button>
    </div>
  );
};

export default OrderCard;
