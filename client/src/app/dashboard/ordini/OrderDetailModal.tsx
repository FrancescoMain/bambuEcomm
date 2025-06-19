import React from "react";
import { Order } from "./OrderList";
import { FiX } from "react-icons/fi";

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
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

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
}) => {
  const [newStatus, setNewStatus] = React.useState(order.status);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdateStatus(order.id, newStatus);
    setIsSaving(false);
    onClose(); // Chiude la modale dopo il salvataggio
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Dettagli Ordine #{order.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Riepilogo Cliente e Stato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Cliente</h3>
              <p>{order.customerName}</p>
              <p>{order.customerEmail}</p>
              <p>{order.telefono}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Indirizzo di Spedizione
              </h3>
              <p>
                {order.via} {order.numero}
              </p>
              <p>
                {order.cap}, {order.citta}, {order.stato}
              </p>
            </div>
          </div>

          {/* Articoli Ordinati */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Articoli</h3>
            <div className="border rounded-lg">
              {order.orderItems?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium">
                      {item.product?.titolo || "Prodotto non disponibile"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Quantità: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    {new Intl.NumberFormat("it-IT", {
                      style: "currency",
                      currency: "EUR",
                    }).format(Number(item.priceAtPurchase))}
                  </p>
                </div>
              ))}
              <div className="flex justify-between items-center p-3 bg-gray-50 font-bold">
                <p>Totale</p>
                <p>
                  {new Intl.NumberFormat("it-IT", {
                    style: "currency",
                    currency: "EUR",
                  }).format(order.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Aggiornamento Stato */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Stato Ordine</h3>
            <div className="flex items-center">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className={`flex-grow p-2 border rounded-l-md ${getStatusClass(
                  newStatus
                )}`}
              >
                <option value="pending">Pending</option>
                <option value="in lavorazione">In Lavorazione</option>
                <option value="spedito">Spedito</option>
                <option value="completed">Completato</option>
                <option value="annullato">Annullato</option>
              </select>
              <button
                onClick={handleSave}
                disabled={isSaving || newStatus === order.status}
                className="bg-[#51946b] text-white px-4 py-2 rounded-r-md hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSaving ? "Salvataggio..." : "Salva"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
