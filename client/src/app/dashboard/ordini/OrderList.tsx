"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import OrderCard from "./OrderCard";
import OrderDetailModal from "./OrderDetailModal";
import { FiSearch } from "react-icons/fi";

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
  const [searchQuery, setSearchQuery] = useState("");

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
        const mapped = (data.data || data.orders || []).map(
          (order: Record<string, unknown>): Order => {
            const user = order.user as
              | { name?: string; email?: string }
              | undefined;
            const guestName = [order.nome, order.cognome]
              .filter(Boolean)
              .join(" ");

            return {
              id: String(order.id),
              createdAt: String(order.createdAt),
              status: String(order.status),
              total: Number(order.totalAmount),
              customerName: user?.name || guestName || "Guest",
              customerEmail: user?.email || String(order.guestEmail || "N/A"),
              orderItems: Array.isArray(order.orderItems)
                ? order.orderItems.map((item: unknown) => {
                    const oi = item as Record<string, unknown>;
                    const product = oi.product as
                      | { titolo?: string }
                      | undefined;
                    return {
                      id: Number(oi.id),
                      product: product
                        ? { titolo: String(product.titolo) }
                        : undefined,
                      quantity: Number(oi.quantity),
                      priceAtPurchase: oi.priceAtPurchase as number | string,
                    };
                  })
                : [],
              via: String(order.via || ""),
              numero: String(order.numero || ""),
              cap: String(order.cap || ""),
              citta: String(order.citta || ""),
              stato: String(order.stato || ""),
              telefono: String(order.telefono || ""),
              note: String(order.note || ""),
            };
          }
        );
        setOrders(mapped);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchOrders();
    }
  }, [token]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://bambu-ecomm-in2g.vercel.app/api";
      const res = await fetch(`${apiUrl}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      // Optionally show an error message to the user
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orders, searchQuery]);

  if (loading) return <div>Caricamento ordini...</div>;
  if (error) return <div className="text-red-500">Errore: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestione Ordini</h1>
        <div className="relative mt-4">
          <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per ID, nome o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#51946b] focus:outline-none"
          />
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onViewDetails={() => setSelectedOrder(order)}
          />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID Ordine
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Totale
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {order.customerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("it-IT")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedOrder?.id === order.id
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {new Intl.NumberFormat("it-IT", {
                    style: "currency",
                    currency: "EUR",
                  }).format(order.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-[#51946b] hover:text-[#3d7a57] transition-colors"
                  >
                    Vedi Dettagli
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
