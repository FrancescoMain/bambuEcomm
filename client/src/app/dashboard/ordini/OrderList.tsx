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
    selectedVariants?: Record<
      number,
      { id: number; nome: string; immagine?: string }
    >; // Nuove varianti
  }>;
  via?: string;
  numero?: string;
  cap?: string;
  citta?: string;
  stato?: string;
  telefono?: string;
  note?: string;
  trackingNumber?: string;
}

export default function OrderList() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date-desc");

  const statusFilters = [
    { value: "ALL", label: "Tutti gli ordini" },
    { value: "PENDING", label: "In attesa" },
    { value: "CONFIRMED", label: "Confermato" },
    { value: "PROCESSING", label: "In preparazione" },
    { value: "SHIPPED", label: "Spedito" },
    { value: "DELIVERED", label: "Consegnato" },
    { value: "CANCELLED", label: "Annullato" },
    { value: "REFUNDED", label: "Rimborsato" },
  ];

  const sortOptions = [
    { value: "date-desc", label: "Più recenti" },
    { value: "date-asc", label: "Più vecchi" },
    { value: "total-desc", label: "Importo maggiore" },
    { value: "total-asc", label: "Importo minore" },
  ];

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
                      selectedVariants: oi.selectedVariants as
                        | Record<
                            number,
                            { id: number; nome: string; immagine?: string }
                          >
                        | undefined, // Aggiungiamo le varianti
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
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      // Aggiorna lo stato locale
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );

      console.log(`✅ Status ordine ${orderId} aggiornato a: ${newStatus}`);

      // Chiudi il modal se è aperto
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Errore nell'aggiornamento dello status dell'ordine");
      alert("Errore nell'aggiornamento dello status dell'ordine");
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Filtra per stato
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filtra per ricerca
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customerName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Ordina
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "date-asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "total-desc":
          return b.total - a.total;
        case "total-asc":
          return a.total - b.total;
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, statusFilter, searchQuery, sortBy]);

  if (loading) return <div>Caricamento ordini...</div>;
  if (error) return <div className="text-red-500">Errore: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Gestione Ordini Admin
        </h1>
        <p className="text-gray-600 mb-6">
          Visualizza e gestisci tutti gli ordini del sistema
        </p>

        {/* Statistiche rapide */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">
              {orders.length}
            </div>
            <div className="text-sm text-gray-600">Totale Ordini</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">
              {orders.filter((o) => o.status === "DELIVERED").length}
            </div>
            <div className="text-sm text-gray-600">Consegnati</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-yellow-600">
              {
                orders.filter((o) =>
                  ["PENDING", "CONFIRMED", "PROCESSING"].includes(o.status)
                ).length
              }
            </div>
            <div className="text-sm text-gray-600">In Elaborazione</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-red-600">
              {
                orders.filter((o) =>
                  ["CANCELLED", "REFUNDED"].includes(o.status)
                ).length
              }
            </div>
            <div className="text-sm text-gray-600">Cancellati/Rimborsati</div>
          </div>
        </div>

        {/* Filtri e Ricerca */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="🔍 Cerca per ID, nome cliente o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#51946b] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51946b] focus:border-transparent"
              >
                {statusFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51946b] focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contatore risultati */}
          <div className="mt-4 text-sm text-gray-600">
            Mostra {filteredOrders.length} di {orders.length} ordini
          </div>
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
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === "DELIVERED"
                        ? "bg-green-100 text-green-800"
                        : order.status === "SHIPPED"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "PROCESSING"
                        ? "bg-yellow-100 text-yellow-800"
                        : order.status === "PENDING"
                        ? "bg-gray-100 text-gray-800"
                        : order.status === "CANCELLED"
                        ? "bg-red-100 text-red-800"
                        : order.status === "REFUNDED"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status === "PENDING"
                      ? "⏰ In Attesa"
                      : order.status === "CONFIRMED"
                      ? "✅ Confermato"
                      : order.status === "PROCESSING"
                      ? "⚙️ In Preparazione"
                      : order.status === "SHIPPED"
                      ? "🚚 Spedito"
                      : order.status === "DELIVERED"
                      ? "🏠 Consegnato"
                      : order.status === "CANCELLED"
                      ? "❌ Annullato"
                      : order.status === "REFUNDED"
                      ? "💰 Rimborsato"
                      : order.status}
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
          onRefreshOrders={() => {
            // Ricarica tutti gli ordini dopo operazioni importanti come cancellazioni
            if (token) {
              const fetchOrders = async () => {
                setLoading(true);
                try {
                  const apiUrl =
                    process.env.NEXT_PUBLIC_API_URL ||
                    "https://bambu-ecomm-in2g.vercel.app/api";
                  const res = await fetch(`${apiUrl}/orders`, {
                    headers: token
                      ? { Authorization: `Bearer ${token}` }
                      : undefined,
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
                        customerEmail:
                          user?.email || String(order.guestEmail || "N/A"),
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
                                priceAtPurchase: oi.priceAtPurchase as
                                  | number
                                  | string,
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
                    err instanceof Error
                      ? err.message
                      : "An unknown error occurred"
                  );
                } finally {
                  setLoading(false);
                }
              };
              fetchOrders();
            }
          }}
        />
      )}
    </div>
  );
}
