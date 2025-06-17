"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export interface Order {
  id: string;
  createdAt: string;
  status: string;
  total: number;
  customerName: string;
  customerEmail: string;
  orderItems?: Array<{
    id: number;
    product?: { titolo: string };
    quantity: number;
    priceAtPurchase: number | string;
  }>;
  via?: string;
  numero?: string;
  cap?: string;
  citta?: string;
  stato?: string;
  telefono?: string;
  note?: string;
}

export default function OrderList() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://bambu-ecomm-in2g.vercel.app/api";
        const res = await fetch(`${apiUrl}/orders`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Errore nel recupero ordini");
        const data = await res.json();
        // Mappa i dati per supportare guest e user
        const mapped = (data.data || data.orders || []).map(
          (order: Record<string, unknown>): Order => ({
            id: String(order.id),
            createdAt: String(order.createdAt),
            status: String(order.status),
            total: Number(order.totalAmount),
            customerName:
              order.user &&
              typeof order.user === "object" &&
              "name" in order.user &&
              order.user.name
                ? String((order.user as { name?: string }).name)
                : (
                    String(order.nome || "") +
                    (order.cognome ? " " + String(order.cognome) : "")
                  ).trim() || "Guest",
            customerEmail:
              order.user &&
              typeof order.user === "object" &&
              "email" in order.user &&
              order.user.email
                ? String((order.user as { email?: string }).email)
                : String(order.guestEmail || ""),
            orderItems: Array.isArray(order.orderItems)
              ? order.orderItems.map((item: unknown) => {
                  const oi = item as Record<string, unknown>;
                  return {
                    id: Number(oi.id),
                    product:
                      oi.product &&
                      typeof oi.product === "object" &&
                      "titolo" in oi.product
                        ? {
                            titolo: String(
                              (oi.product as { titolo?: string }).titolo
                            ),
                          }
                        : undefined,
                    quantity: Number(oi.quantity),
                    priceAtPurchase: oi.priceAtPurchase as number | string,
                  };
                })
              : [],
            via: order.via ? String(order.via) : undefined,
            numero: order.numero ? String(order.numero) : undefined,
            cap: order.cap ? String(order.cap) : undefined,
            citta: order.citta ? String(order.citta) : undefined,
            stato: order.stato ? String(order.stato) : undefined,
            telefono: order.telefono ? String(order.telefono) : undefined,
            note: order.note ? String(order.note) : undefined,
          })
        );
        setOrders(mapped);
      } catch (err) {
        setError("Errore nel recupero ordini");
      }
      setLoading(false);
    };
    fetchOrders();
  }, [token]);

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
  };

  const handleDelete = async (orderId: string) => {
    setShowDeleteConfirm(orderId);
  };

  const confirmDelete = async (orderId: string) => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://bambu-ecomm-in2g.vercel.app/api";
      const res = await fetch(`${apiUrl}/orders/${orderId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Errore eliminazione ordine");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setShowDeleteConfirm(null);
    } catch {
      alert("Errore durante l'eliminazione");
      setShowDeleteConfirm(null);
    }
  };

  const handleSave = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://bambu-ecomm-in2g.vercel.app/api";
      const res = await fetch(`${apiUrl}/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: editStatus }),
      });
      if (!res.ok) throw new Error("Errore aggiornamento ordine");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id ? { ...o, status: editStatus } : o
        )
      );
      setSelectedOrder(null);
    } catch {
      alert("Errore durante il salvataggio");
    }
    setSaving(false);
  };

  // Stato ordine: traduzione IT
  const statoLabel = (status: string) => {
    switch (status) {
      case "PAID":
        return "Pagato";
      case "SHIPPED":
        return "Spedito";
      case "CANCELLED":
        return "Cancellato";
      default:
        return status;
    }
  };

  if (loading) return <div>Caricamento ordini...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Ordini</h2>
      <div className="w-full overflow-x-auto">
        <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-[#dce5df] bg-white">
          <table className="w-full min-w-[700px] whitespace-nowrap">
            <thead>
              <tr className="bg-[#e8f2ec]">
                <th className="p-2">ID</th>
                <th className="p-2">Data</th>
                <th className="p-2">Cliente</th>
                <th className="p-2">Email</th>
                <th className="p-2">Totale</th>
                <th className="p-2">Stato</th>
                <th className="p-2">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t cursor-pointer hover:bg-[#f3f7f4]"
                  onClick={() => setDetailOrder(order)}
                >
                  <td className="p-2">{order.id}</td>
                  <td className="p-2">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="p-2">{order.customerName}</td>
                  <td className="p-2">{order.customerEmail}</td>
                  <td className="p-2">€ {order.total.toFixed(2)}</td>
                  <td className="p-2">{statoLabel(order.status)}</td>
                  <td className="p-2 flex gap-2">
                    {selectedOrder?.id === order.id ? (
                      <>
                        <button
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs"
                          onClick={handleSave}
                          disabled={saving}
                        >
                          Salva
                        </button>
                        <button
                          className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs"
                          onClick={() => setSelectedOrder(null)}
                        >
                          Annulla
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                          onClick={() => handleEdit(order)}
                        >
                          Modifica
                        </button>
                        <button
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                          onClick={() => handleDelete(order.id)}
                        >
                          Elimina
                        </button>
                      </>
                    )}
                    {showDeleteConfirm === order.id && (
                      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                        <div className="bg-white p-6 rounded shadow-lg flex flex-col items-center">
                          <div className="mb-4 text-lg font-semibold">
                            Sei sicuro di voler eliminare questo ordine?
                          </div>
                          <div className="flex gap-4">
                            <button
                              className="bg-red-600 text-white px-4 py-2 rounded"
                              onClick={() => confirmDelete(order.id)}
                            >
                              Conferma
                            </button>
                            <button
                              className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                              onClick={() => setShowDeleteConfirm(null)}
                            >
                              Annulla
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modale dettaglio ordine */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setDetailOrder(null)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-2">
              Dettaglio Ordine #{detailOrder.id}
            </h3>
            <div className="mb-2 text-sm text-gray-700">
              Data: {new Date(detailOrder.createdAt).toLocaleString()}
            </div>
            <div className="mb-2 text-sm text-gray-700">
              Stato: {statoLabel(detailOrder.status)}
            </div>
            <div className="mb-2 text-sm text-gray-700">
              Cliente: {detailOrder.customerName}
            </div>
            <div className="mb-2 text-sm text-gray-700">
              Email: {detailOrder.customerEmail}
            </div>
            {/* Mostra prodotti */}
            {detailOrder.orderItems && detailOrder.orderItems.length > 0 && (
              <div className="mb-4">
                <div className="font-semibold mb-1">Prodotti:</div>
                <ul className="list-disc pl-5">
                  {detailOrder.orderItems.map((item) => (
                    <li key={item.id} className="mb-1">
                      {item.product?.titolo || "Prodotto"} x{item.quantity}{" "}
                      &ndash; €{Number(item.priceAtPurchase).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Mostra indirizzo se presente */}
            {detailOrder.via && (
              <div className="mb-2 text-sm text-gray-700">
                Indirizzo: {detailOrder.via} {detailOrder.numero},{" "}
                {detailOrder.cap} {detailOrder.citta} ({detailOrder.stato})
              </div>
            )}
            {detailOrder.telefono && (
              <div className="mb-2 text-sm text-gray-700">
                Telefono: {detailOrder.telefono}
              </div>
            )}
            {detailOrder.note && (
              <div className="mb-2 text-sm text-gray-700">
                Note: {detailOrder.note}
              </div>
            )}
            <div className="mt-4 font-bold text-lg">
              Totale: € {detailOrder.total.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
