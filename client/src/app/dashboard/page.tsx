"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RootState } from "@/redux/store";
import Link from 'next/link';
import { FiBox, FiClipboard, FiMessageSquare } from 'react-icons/fi';

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();

  useEffect(() => {
    console.log("DashboardPage useEffect", { user, isLoading, token });
    if (isLoading) return;
    if (!user && !token) {
      router.replace("/login");
    } else if (user && user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [user, isLoading, token, router]);

  if (isLoading || (token && !user)) {
    return <div>Loading...</div>;
  }
  if (!user || user.role !== "ADMIN") {
    return null;
  }

  // Dati di esempio - questi verranno sostituiti con dati reali
  const summaryData = {
    ordersToFulfill: 5,
    lowStockProducts: 3,
    unreadMessages: 2,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Benvenuto, {user.name || 'Admin'}!</h1>
      <p className="text-gray-600 mb-8">Ecco un riepilogo della tua attività.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Ordini */}
        <Link href="/dashboard/ordini">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer">
            <div className="flex items-center">
              <FiClipboard className="text-3xl text-[#51946b]" />
              <div className="ml-4">
                <p className="text-lg font-semibold text-gray-700">Ordini da Evadere</p>
                <p className="text-2xl font-bold text-gray-900">{summaryData.ordersToFulfill}</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Card Prodotti */}
        <Link href="/dashboard/prodotti">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer">
            <div className="flex items-center">
              <FiBox className="text-3xl text-[#51946b]" />
              <div className="ml-4">
                <p className="text-lg font-semibold text-gray-700">Prodotti in Esaurimento</p>
                <p className="text-2xl font-bold text-gray-900">{summaryData.lowStockProducts}</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Card Messaggi (esempio) */}
        <Link href="/dashboard/messaggi">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer">
            <div className="flex items-center">
              <FiMessageSquare className="text-3xl text-[#51946b]" />
              <div className="ml-4">
                <p className="text-lg font-semibold text-gray-700">Messaggi non Letti</p>
                <p className="text-2xl font-bold text-gray-900">{summaryData.unreadMessages}</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Qui potrebbe esserci un'altra sezione, ad es. un grafico delle vendite */}
    </div>
  );
}
