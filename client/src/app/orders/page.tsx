"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useNotifications } from "@/components/ui/NotificationProvider";
import Link from "next/link";

interface OrderItem {
  id: number;
  product?: {
    titolo: string;
    immagine?: string;
    prezzo: number;
  };
  quantity: number;
  priceAtPurchase: number;
}

interface Order {
  id: string;
  createdAt: string;
  status: string;
  total: number;
  customerName: string;
  customerEmail: string;
  orderItems?: OrderItem[];
  via?: string;
  numero?: string;
  cap?: string;
  citta?: string;
  stato?: string;
  telefono?: string;
  note?: string;
  trackingNumber?: string;
  paymentIntentId?: string;
  canCancel?: boolean;
}

const statusTranslations: { [key: string]: string } = {
  PENDING: "In attesa",
  CONFIRMED: "Confermato",
  PROCESSING: "In preparazione",
  SHIPPED: "Spedito",
  DELIVERED: "Consegnato",
  CANCELLED: "Annullato",
  RETURNED: "Reso",
  REFUNDED: "Rimborsato",
};

const statusColors: { [key: string]: string } = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  PROCESSING: "bg-purple-100 text-purple-800 border-purple-200",
  SHIPPED: "bg-green-100 text-green-800 border-green-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  RETURNED: "bg-gray-100 text-gray-800 border-gray-200",
  REFUNDED: "bg-orange-100 text-orange-800 border-orange-200",
};

const statusIcons: { [key: string]: string } = {
  PENDING: "⏰",
  CONFIRMED: "✅",
  PROCESSING: "⚙️",
  SHIPPED: "🚚",
  DELIVERED: "🏠",
  CANCELLED: "❌",
  RETURNED: "↩️",
  REFUNDED: "💰",
};

const statusDescriptions: { [key: string]: string } = {
  PENDING: "Il tuo ordine è in attesa di conferma",
  CONFIRMED: "Ordine confermato, in preparazione",
  PROCESSING: "Stiamo preparando il tuo ordine",
  SHIPPED: "Il tuo ordine è in viaggio",
  DELIVERED: "Ordine consegnato con successo",
  CANCELLED: "Ordine annullato",
  RETURNED: "Ordine reso",
  REFUNDED: "Rimborso processato",
};

export default function OrdersPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const { showToast } = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [showCancelModal, setShowCancelModal] = useState<Order | null>(null);
  const [claimingOrders, setClaimingOrders] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Filtri per stato (aggiornati)
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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://bambu-ecomm-in2g.vercel.app/api";
      const res = await fetch(`${apiUrl}/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Errore nel recupero degli ordini");
      }

      const data = await res.json();

      // Mappiamo i dati per assicurarci che abbiano la struttura corretta
      const mappedOrders = data.map((order: any) => ({
        id: order.id.toString(),
        createdAt: order.createdAt,
        status: order.status,
        total: Number(order.totalAmount),
        customerName:
          order.user?.name ||
          `${order.nome || ""} ${order.cognome || ""}`.trim() ||
          "Cliente",
        customerEmail: order.user?.email || order.guestEmail || "",
        orderItems: order.orderItems || [],
        via: order.via || "",
        numero: order.numero || "",
        cap: order.cap || "",
        citta: order.citta || "",
        stato: order.stato || "",
        telefono: order.telefono || "",
        note: order.note || "",
        trackingNumber: order.trackingNumber || "",
        paymentIntentId: order.paymentIntentId || "",
      }));

      console.log("📦 Ordini ricevuti dal backend:", mappedOrders);
      setOrders(mappedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user || !token) return;
    fetchOrders();
  }, [user, token, fetchOrders]);

  // Effect per controllare lo stato auth e determinare quando è stato inizializzato
  useEffect(() => {
    if (!isLoading) {
      setAuthChecked(true);
    }
  }, [isLoading]);

  // Filtraggio e ordinamento ordini
  useEffect(() => {
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
          order.orderItems?.some((item) =>
            item.product?.titolo
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())
          )
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

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchQuery, sortBy]);

  const handleCancelOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://bambu-ecomm-in2g.vercel.app/api";

      const res = await fetch(`${apiUrl}/orders/${orderId}/cancel`, {
        method: "POST",
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

      // Mostra un messaggio di successo più dettagliato
      const successMessage = result.refund
        ? `✅ Ordine cancellato con successo! Il rimborso di €${(
            result.refund.amount / 100
          ).toFixed(
            2
          )} è stato processato e sarà visibile sulla tua carta entro 5-10 giorni lavorativi.`
        : result.message ||
          "Richiesta di cancellazione inviata. Il rimborso sarà elaborato entro 5-10 giorni lavorativi.";

      showToast(successMessage, "success");
      setShowCancelModal(null);
      await fetchOrders(); // Ricarica gli ordini
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Errore sconosciuto",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Funzione per determinare se un ordine può essere cancellato
  const canCancelOrder = (order: Order): boolean => {
    const cancelableStatuses = ["PENDING", "CONFIRMED"];
    if (!cancelableStatuses.includes(order.status)) return false;

    // Controlla se sono passate più di 24 ore dalla creazione dell'ordine
    const orderDate = new Date(order.createdAt);
    const cancelDeadline = new Date(orderDate.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();

    return now <= cancelDeadline;
  };

  // Funzione per calcolare il tempo rimanente per la cancellazione
  const getCancelTimeRemaining = (order: Order): string | null => {
    if (!canCancelOrder(order)) return null;

    const orderDate = new Date(order.createdAt);
    const cancelDeadline = new Date(orderDate.getTime() + 24 * 60 * 60 * 1000); // 24 ore
    const now = new Date();

    if (now > cancelDeadline) return null;

    const remaining = cancelDeadline.getTime() - now.getTime();
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    return `${hours}h ${minutes}m`;
  };

  const handleRequestReturn = async (orderId: string) => {
    if (!confirm("Sei sicuro di voler richiedere il reso per questo ordine?"))
      return;

    setActionLoading(orderId);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://bambu-ecomm-in2g.vercel.app/api";
      const res = await fetch(`${apiUrl}/orders/${orderId}/return`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Errore nella richiesta di reso");
      }

      alert("Richiesta di reso inviata con successo! Ti contatteremo presto.");
      await fetchOrders(); // Ricarica gli ordini
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTrackOrder = (trackingNumber: string) => {
    // Tracking con GLS
    const trackingUrl = `https://gls-group.eu/IT/it/ricerca-spedizione?match=${trackingNumber}`;
    window.open(trackingUrl, "_blank");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canRequestReturn = (status: string) => {
    return ["DELIVERED"].includes(status);
  };

  const handleClaimGuestOrders = async () => {
    if (!token) return;

    setClaimingOrders(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://bambu-ecomm-in2g.vercel.app/api";

      const res = await fetch(`${apiUrl}/orders/claim-guest-orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Errore nel reclamo degli ordini");
      }

      const result = await res.json();

      if (result.claimedOrders > 0) {
        showToast(`✅ ${result.message}`, "success");
        await fetchOrders(); // Ricarica gli ordini
      } else {
        showToast("ℹ️ " + result.message, "info");
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Errore sconosciuto",
        "error"
      );
    } finally {
      setClaimingOrders(false);
    }
  };

  // Mostra loading se l'auth sta ancora caricando o non è stato controllato
  if (isLoading || !authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#51946b] mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Accesso richiesto
          </h1>
          <p className="text-gray-600 mb-6">
            Devi effettuare l&apos;accesso per visualizzare i tuoi ordini.
          </p>
          <Link
            href="/login"
            className="bg-[#51946b] text-white px-6 py-3 rounded-lg hover:bg-[#3d7a57] transition-colors"
          >
            Accedi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#51946b] to-[#3d7a57] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="mb-4">
            <span className="text-5xl mb-4 block">📦</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              I Miei Ordini
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-2">
              Visualizza e gestisci i tuoi ordini
            </p>
            <p className="text-green-200">{orders.length} ordini totali</p>
          </div>
        </div>
      </div>

      {/* Filtri e Ricerca */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-4">
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

            {/* Mobile Filters */}
            <div className="md:hidden w-full space-y-3">
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51946b] focus:border-transparent"
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
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51946b] focus:border-transparent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="🔍 Cerca per numero ordine o prodotto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-80 px-4 py-2 pl-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51946b] focus:border-transparent"
              />
            </div>
          </div>

          {/* Results Counter */}
          <div className="mt-4 text-center md:text-left">
            <p className="text-gray-600">
              Mostra {filteredOrders.length} di {orders.length} ordini
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Info Box per Cancellazioni */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-blue-600"
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
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📋 Informazioni su Cancellazioni e Rimborsi
              </h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <strong>⏰ Periodo di cancellazione:</strong> Puoi cancellare
                  gratuitamente i tuoi ordini entro 24 ore dalla conferma,
                  purché non siano già stati spediti.
                </p>
                <p>
                  <strong>💳 Rimborsi automatici:</strong> I rimborsi vengono
                  processati automaticamente tramite Stripe sulla carta
                  utilizzata per il pagamento e saranno visibili entro 5-10
                  giorni lavorativi.
                </p>
                <p>
                  <strong>📞 Assistenza:</strong> Per ordini spediti o per
                  richieste speciali, contatta il nostro servizio clienti.
                </p>
              </div>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#51946b]"></div>
            <p className="mt-4 text-gray-600">Caricamento ordini...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Errore nel caricamento
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchOrders}
              className="bg-[#51946b] text-white px-6 py-2 rounded-lg hover:bg-[#3d7a57] transition-colors"
            >
              Riprova
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {orders.length === 0
                ? "Nessun ordine trovato"
                : "Nessun risultato"}
            </h3>
            <p className="text-gray-600 mb-6">
              {orders.length === 0
                ? "Non hai ancora effettuato nessun ordine."
                : "Nessun ordine corrisponde ai filtri selezionati."}
            </p>
            {orders.length === 0 ? (
              <Link
                href="/products"
                className="bg-[#51946b] text-white px-6 py-3 rounded-lg hover:bg-[#3d7a57] transition-colors"
              >
                Inizia a comprare
              </Link>
            ) : (
              <button
                onClick={() => {
                  setStatusFilter("ALL");
                  setSearchQuery("");
                  setSortBy("date-desc");
                }}
                className="bg-[#51946b] text-white px-6 py-3 rounded-lg hover:bg-[#3d7a57] transition-colors"
              >
                Resetta Filtri
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📦</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Ordine #{order.id}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                            statusColors[order.status] ||
                            "bg-gray-100 text-gray-800 border-gray-200"
                          }`}
                        >
                          {statusIcons[order.status]}
                          {statusTranslations[order.status] || order.status}
                        </span>

                        {/* Descrizione dello stato */}
                        <div className="text-xs text-gray-500 mt-1">
                          {statusDescriptions[order.status] || "Stato ordine"}
                        </div>

                        {/* Tempo rimanente per cancellazione */}
                        {canCancelOrder(order) &&
                          getCancelTimeRemaining(order) && (
                            <span className="text-xs text-yellow-700 bg-yellow-100 border border-yellow-200 px-2 py-1 rounded-full">
                              ⏰ {getCancelTimeRemaining(order)} per cancellare
                            </span>
                          )}

                        <span className="font-bold text-lg text-[#51946b]">
                          €{order.total.toFixed(2)}
                        </span>
                        {order.trackingNumber && (
                          <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                            📦 {order.trackingNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Dettagli
                      </button>

                      {order.trackingNumber && (
                        <button
                          onClick={() =>
                            handleTrackOrder(order.trackingNumber!)
                          }
                          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Traccia
                        </button>
                      )}

                      {canCancelOrder(order) && (
                        <button
                          onClick={() => setShowCancelModal(order)}
                          disabled={actionLoading === order.id}
                          className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {actionLoading === order.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Cancellazione...
                            </>
                          ) : (
                            <>❌ Richiedi cancellazione</>
                          )}
                        </button>
                      )}

                      {canRequestReturn(order.status) && (
                        <button
                          onClick={() => handleRequestReturn(order.id)}
                          disabled={actionLoading === order.id}
                          className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === order.id ? "..." : "Richiedi reso"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {order.orderItems?.length || 0} articoli
                    </span>
                    {order.trackingNumber && (
                      <span className="text-sm text-[#51946b]">
                        📦 Tracking: {order.trackingNumber}
                      </span>
                    )}
                  </div>

                  {order.orderItems && order.orderItems.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {order.orderItems.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {item.product?.immagine ? (
                              <img
                                src={item.product.immagine}
                                alt={item.product.titolo}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <span className="text-gray-400">📦</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {item.product?.titolo || "Prodotto"}
                            </p>
                            <p className="text-xs text-gray-600">
                              Quantità: {item.quantity} • €
                              {Number(item.priceAtPurchase).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.orderItems.length > 2 && (
                        <p className="text-sm text-gray-600">
                          e altri {order.orderItems.length - 2} articoli...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Dettagli Ordine #{selectedOrder.id}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Order Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Informazioni Ordine
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Data:</span>
                    <p className="font-medium">
                      {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Stato:</span>
                    <p className="font-medium">
                      {statusTranslations[selectedOrder.status] ||
                        selectedOrder.status}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Totale:</span>
                    <p className="font-medium text-[#51946b]">
                      €{selectedOrder.total.toFixed(2)}
                    </p>
                  </div>
                  {selectedOrder.trackingNumber && (
                    <div>
                      <span className="text-gray-600">Tracking:</span>
                      <p className="font-medium">
                        {selectedOrder.trackingNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.via && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Indirizzo di Spedizione
                  </h3>
                  <div className="text-sm text-gray-700">
                    <p>
                      {selectedOrder.via} {selectedOrder.numero}
                    </p>
                    <p>
                      {selectedOrder.cap} {selectedOrder.citta}
                    </p>
                    <p>{selectedOrder.stato}</p>
                    {selectedOrder.telefono && (
                      <p>Tel: {selectedOrder.telefono}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Articoli Ordinati
                </h3>
                <div className="space-y-3">
                  {selectedOrder.orderItems?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        {item.product?.immagine ? (
                          <img
                            src={item.product.immagine}
                            alt={item.product.titolo}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-gray-400">📦</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.product?.titolo || "Prodotto"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Quantità: {item.quantity}
                        </p>
                        <p className="text-sm text-[#51946b] font-medium">
                          €{Number(item.priceAtPurchase).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.note && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Note</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedOrder.note}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal di cancellazione */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
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
                Richiedi Cancellazione Ordine
              </h3>
              <p className="text-gray-600 mb-2">Ordine #{showCancelModal.id}</p>
              <p className="text-sm text-gray-500 mb-6">
                Sei sicuro di voler richiedere la cancellazione di questo
                ordine? Il rimborso sarà elaborato automaticamente entro 5-10
                giorni lavorativi sulla carta utilizzata per il pagamento.
              </p>

              {/* Tempo rimanente per la cancellazione */}
              {getCancelTimeRemaining(showCancelModal) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⏰ Tempo rimanente per la cancellazione gratuita:{" "}
                    {getCancelTimeRemaining(showCancelModal)}
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCancelModal(null)}
                  disabled={actionLoading === showCancelModal.id}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  onClick={() => handleCancelOrder(showCancelModal.id)}
                  disabled={actionLoading === showCancelModal.id}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === showCancelModal.id ? (
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
  );
}
