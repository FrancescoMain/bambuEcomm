"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RootState } from "@/redux/store";
import Link from "next/link";
import {
  FiBox,
  FiClipboard,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiShoppingCart,
  FiPackage,
  FiAlertCircle,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, isThisMonth, isToday, isThisWeek } from "date-fns";

// Interfaces for TypeScript
interface DashboardSummary {
  totalOrders: number;
  newOrdersToday: number;
  pendingOrders: number;
  shippedToday: number;
  totalRevenue: number;
  monthlyGrowth: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  newCustomersThisWeek: number;
  conversionRate: number;
  averageOrderValue: number;
}

interface SalesData {
  month: string;
  vendite: number;
  ordini: number;
  fatturato: number;
}

interface RecentActivity {
  time: string;
  action: string;
  type: string;
  urgent: boolean;
}

interface TopProduct {
  name: string;
  sold: number;
  revenue: number;
}

interface DashboardData {
  summary: DashboardSummary;
  salesData: SalesData[];
  recentActivity: RecentActivity[];
  topProducts: TopProduct[];
}

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("DashboardPage useEffect", { user, isLoading, token });
    if (isLoading) return;
    if (!user && !token) {
      router.replace("/login");
    } else if (user && user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [user, isLoading, token, router]);

  useEffect(() => {
    // Carica dati reali dal backend
    const fetchDashboardData = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://bambu-ecomm-in2g.vercel.app/api";
        const response = await fetch(`${apiUrl}/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Errore nel caricamento delle statistiche");
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Errore nel caricamento dashboard:", error);
        // In caso di errore, mantieni la dashboard nascosta
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === "ADMIN" && token) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  if (isLoading || (token && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-[#51946b]">Caricamento...</div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#51946b] mb-4"></div>
          <div className="text-lg text-[#51946b]">Caricamento dashboard...</div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Dashboard non disponibile
          </h2>
          <p className="text-gray-600 mb-6">
            Non è stato possibile caricare le statistiche. Assicurati di avere i
            permessi necessari.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#51946b] text-white px-6 py-3 rounded-lg hover:bg-[#3d7a57] transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  const { summary, salesData, recentActivity, topProducts } = dashboardData;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#51946b] to-[#3d7a57] text-white rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">
          Dashboard Admin - Cartoleria Bambù
        </h1>
        <p className="text-xl text-green-100">
          Benvenuto, {user.name || "Admin"}! Ecco un riepilogo
          dell&apos;attività di oggi.
        </p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white/20 rounded-lg p-3">
            <div className="font-semibold">Ordini Oggi</div>
            <div className="text-2xl font-bold">{summary.newOrdersToday}</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="font-semibold">Spediti Oggi</div>
            <div className="text-2xl font-bold">{summary.shippedToday}</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="font-semibold">Fatturato Mese</div>
            <div className="text-2xl font-bold">€{summary.totalRevenue}</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="font-semibold">Crescita</div>
            <div className="text-2xl font-bold text-green-200">
              +{summary.monthlyGrowth}%
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/ordini" className="group">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-[#51946b]">
            <div className="flex items-center justify-between mb-4">
              <FiClipboard className="text-3xl text-[#51946b]" />
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                {summary.pendingOrders} in attesa
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Ordini Totali
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {summary.totalOrders}
            </p>
            <p className="text-sm text-green-600 mt-2">
              +{summary.newOrdersToday} oggi
            </p>
          </div>
        </Link>

        <Link href="/dashboard/prodotti" className="group">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-[#51946b]">
            <div className="flex items-center justify-between mb-4">
              <FiBox className="text-3xl text-[#51946b]" />
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                {summary.lowStockProducts} in esaurimento
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Prodotti
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {summary.totalProducts}
            </p>
            <p className="text-sm text-blue-600 mt-2">Catalogo completo</p>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <FiUsers className="text-3xl text-[#51946b]" />
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
              +{summary.newCustomersThisWeek} questa settimana
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Clienti</h3>
          <p className="text-3xl font-bold text-gray-900">
            {summary.totalCustomers}
          </p>
          <p className="text-sm text-purple-600 mt-2">Base clienti crescente</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <FiDollarSign className="text-3xl text-[#51946b]" />
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              €{summary.averageOrderValue} valore medio
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Fatturato
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            €{summary.totalRevenue}
          </p>
          <p className="text-sm text-green-600 mt-2">
            +{summary.monthlyGrowth}% vs mese scorso
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <FiTrendingUp className="mr-3 text-[#51946b]" />
            Andamento Vendite 2024
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  name === "fatturato" ? `€${value}` : value,
                  name === "fatturato"
                    ? "Fatturato"
                    : name === "vendite"
                    ? "Vendite"
                    : "Ordini",
                ]}
              />
              <Area
                type="monotone"
                dataKey="fatturato"
                stackId="1"
                stroke="#51946b"
                fill="#51946b"
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <FiAlertCircle className="mr-3 text-[#51946b]" />
            Attività Recente
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity: RecentActivity, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${
                      activity.urgent
                        ? "bg-red-500"
                        : activity.type === "order"
                        ? "bg-blue-500"
                        : activity.type === "shipping"
                        ? "bg-green-500"
                        : activity.type === "payment"
                        ? "bg-purple-500"
                        : "bg-gray-500"
                    }`}
                  ></div>
                  <span className="text-gray-800">{activity.action}</span>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <FiPackage className="mr-3 text-[#51946b]" />
            Top Prodotti
          </h3>
          <div className="space-y-4">
            {topProducts.map((product: TopProduct, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.sold} venduti
                  </p>
                </div>
                <span className="text-sm font-bold text-[#51946b]">
                  €{product.revenue}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Azioni Rapide</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/ordini"
            className="bg-[#51946b] text-white p-4 rounded-lg text-center hover:bg-[#3d7a57] transition-colors"
          >
            <FiClipboard className="mx-auto mb-2 text-2xl" />
            <span className="block text-sm font-medium">Gestisci Ordini</span>
          </Link>
          <Link
            href="/dashboard/prodotti"
            className="bg-blue-500 text-white p-4 rounded-lg text-center hover:bg-blue-600 transition-colors"
          >
            <FiBox className="mx-auto mb-2 text-2xl" />
            <span className="block text-sm font-medium">Aggiungi Prodotto</span>
          </Link>
          <Link
            href="/dashboard/import-prodotti"
            className="bg-orange-500 text-white p-4 rounded-lg text-center hover:bg-orange-600 transition-colors"
          >
            <FiPackage className="mx-auto mb-2 text-2xl" />
            <span className="block text-sm font-medium">Importa Prodotti</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
