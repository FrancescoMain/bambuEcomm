import React, { useState } from "react";
import { Order } from "./OrderList";
import { FiX } from "react-icons/fi";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
  onRefreshOrders?: () => void;
}

const getStatusClass = (status: string) => {
  switch (status.toUpperCase()) {
    case "DELIVERED":
    case "CONSEGNATO":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "SHIPPED":
    case "SPEDITO":
      return "bg-green-100 text-green-800 border-green-200";
    case "PROCESSING":
    case "IN_PREPARAZIONE":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "CONFIRMED":
    case "CONFERMATO":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "PENDING":
    case "IN_ATTESA":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "CANCELLED":
    case "ANNULLATO":
      return "bg-red-100 text-red-800 border-red-200";
    case "REFUNDED":
    case "RIMBORSATO":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
  onRefreshOrders,
}) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [newStatus, setNewStatus] = useState(order.status);
  const [isSaving, setIsSaving] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdateStatus(order.id, newStatus);
    setIsSaving(false);
    onClose(); // Chiude la modale dopo il salvataggio
  };

  const handleCancelOrder = async () => {
    setCancellingOrder(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://bambu-ecomm-in2g.vercel.app/api";

      const res = await fetch(`${apiUrl}/orders/${order.id}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || "Errore nell'annullamento dell'ordine"
        );
      }

      const result = await res.json();

      // Show success message
      alert(
        result.message ||
          "Ordine cancellato con successo. Il rimborso è stato processato automaticamente."
      );

      // Refresh the order status
      await onUpdateStatus(order.id, "CANCELLED");
      setShowCancelModal(false);
      onClose();

      // Refresh the orders list if callback provided
      if (onRefreshOrders) {
        onRefreshOrders();
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Errore sconosciuto durante la cancellazione"
      );
    } finally {
      setCancellingOrder(false);
    }
  };

  const canCancelOrder = () => {
    const cancelableStatuses = ["PENDING", "CONFIRMED", "PROCESSING"];
    return cancelableStatuses.includes(order.status.toUpperCase());
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
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Stato Ordine</h3>
            <div className="flex items-center gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className={`flex-grow p-2 border rounded-md ${getStatusClass(
                  newStatus
                )}`}
              >
                <option value="PENDING">In Attesa</option>
                <option value="CONFIRMED">Confermato</option>
                <option value="PROCESSING">In Preparazione</option>
                <option value="SHIPPED">Spedito</option>
                <option value="DELIVERED">Consegnato</option>
                <option value="CANCELLED">Annullato</option>
                <option value="REFUNDED">Rimborsato</option>
              </select>
              <button
                onClick={handleSave}
                disabled={isSaving || newStatus === order.status}
                className="bg-[#51946b] text-white px-4 py-2 rounded-md hover:bg-[#3d7a57] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSaving ? "Salvataggio..." : "Salva"}
              </button>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-3">Azioni Admin</h3>
            <div className="flex gap-2">
              {canCancelOrder() && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-2"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Cancella e Rimborsa
                </button>
              )}

              <button
                onClick={async () => {
                  const trackingNumber = prompt(
                    "Inserisci il numero di tracking:"
                  );
                  if (trackingNumber) {
                    try {
                      // Usa l'API service centralizzato
                      const apiService = (await import("@/api/apiService"))
                        .default;

                      await apiService.patch(`/orders/${order.id}/tracking`, {
                        trackingNumber,
                      });

                      alert("Tracking number aggiornato con successo!");
                      onClose(); // Chiudi il modal
                      window.location.reload(); // Ricarica la pagina per aggiornare i dati
                    } catch (error: any) {
                      console.error(
                        "Errore durante l'aggiornamento del tracking:",
                        error
                      );
                      const errorMessage =
                        error.response?.data?.message ||
                        "Impossibile aggiornare il tracking number";
                      alert(`Errore: ${errorMessage}`);
                    }
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Aggiungi Tracking
              </button>
            </div>
          </div>
        </div>

        {/* Cancel Order Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Cancella Ordine e Rimborsa
                </h3>
                <p className="text-gray-600 mb-2">
                  Ordine #{order.id} - {order.customerName}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Sei sicuro di voler cancellare questo ordine? Il rimborso sarà
                  processato automaticamente tramite Stripe se il pagamento è
                  stato effettuato online.
                </p>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancellingOrder}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancellingOrder}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {cancellingOrder ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Elaborazione...
                      </>
                    ) : (
                      "Conferma Cancellazione"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailModal;
