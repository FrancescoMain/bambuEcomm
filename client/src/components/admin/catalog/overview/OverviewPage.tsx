"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { BadgePercent, Euro, PackageX, Plus, ShoppingBag, TrendingDown, TrendingUp, Users } from "lucide-react";
import { PageTitle } from "@/components/admin/PageTitle";
import { StatCard } from "@/components/admin/StatCard";
import { Button, LinkButton } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Spinner";
import { api, errorMessage } from "@/lib/api/client";
import { formatDate, formatPrice } from "@/lib/format";
import { useAuth } from "@/store/auth";
import { Segmented } from "../Segmented";
import type { DashboardStats } from "../types";
import { QuickActions, RecentOrders, TodoCard, TopProducts } from "./OverviewCards";
import type { SalesMeasure } from "./SalesChart";

// recharts solo qui e solo nel browser: non finisce nel bundle delle altre pagine
const SalesChart = dynamic(() => import("./SalesChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const greeting = () => {
  const hour = Number(new Date().toLocaleString("it-IT", { hour: "numeric", hour12: false, timeZone: "Europe/Rome" }));
  if (hour >= 5 && hour < 13) return "Buongiorno";
  if (hour >= 13 && hour < 18) return "Buon pomeriggio";
  return "Buonasera";
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function OverviewPage() {
  const user = useAuth((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [measure, setMeasure] = useState<SalesMeasure>("fatturato");
  const [attempt, setAttempt] = useState(0);
  const [hello, setHello] = useState({ greeting: "Ciao", today: "" });

  // Saluto e data calcolati nel browser (ora locale del negozio)
  useEffect(() => {
    setHello({ greeting: greeting(), today: capitalize(formatDate(new Date(), { weekday: "long" })) });
  }, []);

  useEffect(() => {
    let alive = true;
    api<DashboardStats>("/dashboard/stats")
      .then((res) => {
        if (!alive) return;
        setStats(res);
        setError(null);
      })
      .catch((e) => alive && setError(errorMessage(e, "Impossibile caricare il riepilogo.")));
    return () => {
      alive = false;
    };
  }, [attempt]);

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const s = stats?.summary;
  const growth = s?.monthlyGrowth ?? 0;
  const sales = stats?.salesData ?? [];
  const current = sales[sales.length - 1];
  const yearRevenue = sales.reduce((sum, m) => sum + m.fatturato, 0);
  const yearOrders = sales.reduce((sum, m) => sum + m.ordini, 0);
  const hasSales = sales.some((m) => m.fatturato > 0 || m.ordini > 0);

  return (
    <div className="space-y-6">
      <PageTitle
        title={`${hello.greeting}${firstName ? `, ${firstName}` : ""}!`}
        description={hello.today ? `${hello.today}. Ecco come va il negozio.` : "Ecco come va il negozio."}
        actions={
          <>
            <LinkButton href="/dashboard/prodotti?sconto=1" variant="outline">
              <BadgePercent className="h-4 w-4 text-magenta" /> Applica uno sconto
            </LinkButton>
            <LinkButton href="/dashboard/prodotti/nuovo">
              <Plus className="h-4 w-4" /> Nuovo prodotto
            </LinkButton>
          </>
        }
      />

      {error && !stats ? (
        <div className="card p-8 text-center">
          <p className="font-semibold">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => setAttempt((a) => a + 1)}>
            Riprova
          </Button>
        </div>
      ) : !stats || !s ? (
        <OverviewSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="Ordini da evadere"
              value={stats.todo.ordiniDaEvadere}
              hint={s.newOrdersToday ? `${s.newOrdersToday} arrivati oggi` : "Nessun ordine nuovo oggi"}
              icon={<ShoppingBag className="h-5 w-5" />}
              tone={stats.todo.ordiniDaEvadere ? "bg-orange-soft text-orange-ink" : "bg-brand-50 text-brand-700"}
              href="/dashboard/ordini"
            />
            <StatCard
              label="Fatturato del mese"
              value={formatPrice(s.totalRevenue)}
              hint={
                growth === 0 ? (
                  "Come il mese scorso"
                ) : (
                  <span className={growth > 0 ? "inline-flex items-center gap-1 font-semibold text-brand-700" : "inline-flex items-center gap-1 font-semibold text-magenta-ink"}>
                    {growth > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {growth > 0 ? "+" : ""}
                    {growth.toLocaleString("it-IT")}% sul mese scorso
                  </span>
                )
              }
              icon={<Euro className="h-5 w-5" />}
            />
            <StatCard
              label="Prodotti in offerta"
              value={s.onSaleProducts}
              hint="Gestisci sconti e coupon"
              icon={<BadgePercent className="h-5 w-5" />}
              tone="bg-magenta-soft text-magenta-ink"
              href="/dashboard/promozioni"
            />
            <StatCard
              label="Prodotti esauriti"
              value={s.unavailableProducts}
              hint={`su ${s.totalProducts.toLocaleString("it-IT")} prodotti`}
              icon={<PackageX className="h-5 w-5" />}
              tone="bg-paper-warm text-ink-soft"
              href="/dashboard/prodotti?disponibilita=esauriti"
            />
            <StatCard
              label="Clienti registrati"
              value={s.totalCustomers.toLocaleString("it-IT")}
              hint={s.newCustomersThisWeek ? `+${s.newCustomersThisWeek} questa settimana` : "Nessun nuovo cliente questa settimana"}
              icon={<Users className="h-5 w-5" />}
              tone="bg-sky-soft text-sky-ink"
            />
          </div>

          <QuickActions />

          <div className="grid gap-6 lg:grid-cols-3">
            <TodoCard todo={stats.todo} />
            <section className="card p-5 sm:p-6 lg:col-span-2" aria-labelledby="vendite-titolo">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="vendite-titolo" className="text-lg font-bold">
                    {measure === "fatturato" ? "Fatturato" : "Ordini"} degli ultimi 12 mesi
                  </h2>
                  <p className="text-sm text-ink-muted">
                    Questo mese{" "}
                    <strong className="text-ink">
                      {measure === "fatturato" ? formatPrice(current?.fatturato ?? 0) : current?.ordini ?? 0}
                    </strong>{" "}
                    · in 12 mesi{" "}
                    <strong className="text-ink">{measure === "fatturato" ? formatPrice(yearRevenue) : yearOrders}</strong>
                  </p>
                </div>
                <Segmented<SalesMeasure>
                  label="Cosa mostrare nel grafico"
                  size="sm"
                  value={measure}
                  onChange={setMeasure}
                  options={[
                    { value: "fatturato", label: "Fatturato" },
                    { value: "ordini", label: "Ordini" },
                  ]}
                />
              </div>
              <div className="relative mt-4 h-64" aria-hidden>
                <SalesChart data={sales} measure={measure} />
                {!hasSales && (
                  <p className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">
                    Le vendite dei prossimi mesi appariranno qui.
                  </p>
                )}
              </div>
              <table className="sr-only">
                <caption>Fatturato e ordini degli ultimi 12 mesi</caption>
                <thead>
                  <tr>
                    <th scope="col">Mese</th>
                    <th scope="col">Fatturato</th>
                    <th scope="col">Ordini</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((m, i) => (
                    <tr key={m.month + i}>
                      <th scope="row">{m.month}</th>
                      <td>{formatPrice(m.fatturato)}</td>
                      <td>{m.ordini}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentOrders orders={stats.recentOrders} />
            </div>
            <TopProducts products={stats.topProducts} />
          </div>
        </>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Caricamento riepilogo">
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-[104px] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
      </div>
    </div>
  );
}
