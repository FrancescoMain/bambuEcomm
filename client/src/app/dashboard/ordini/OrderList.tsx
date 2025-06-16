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
        setOrders(data.orders || []);
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

  if (loading) return <div>Caricamento ordini...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Ordini</h2>
      <table className="w-full border bg-white">
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
            <tr key={order.id} className="border-t">
              <td className="p-2">{order.id}</td>
              <td className="p-2">
                {new Date(order.createdAt).toLocaleString()}
              </td>
              <td className="p-2">{order.customerName}</td>
              <td className="p-2">{order.customerEmail}</td>
              <td className="p-2">€ {order.total.toFixed(2)}</td>
              <td className="p-2">
                {selectedOrder?.id === order.id ? (
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="PAID">PAID</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                ) : (
                  order.status
                )}
              </td>
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
  );
}
