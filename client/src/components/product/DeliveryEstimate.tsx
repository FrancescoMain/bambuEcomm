"use client";

import { useEffect, useState } from "react";
import { PackageCheck, Store, Truck } from "lucide-react";

// Festività nazionali fisse (la consegna non avviene in questi giorni)
const HOLIDAYS = ["01-01", "01-06", "04-25", "05-01", "06-02", "08-15", "11-01", "12-08", "12-25", "12-26"];

const isWorkingDay = (d: Date) => {
  const key = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return d.getDay() !== 0 && d.getDay() !== 6 && !HOLIDAYS.includes(key);
};

const addWorkingDays = (from: Date, days: number) => {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (isWorkingDay(d)) added++;
  }
  return d;
};

const fmt = (d: Date) => d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });

/**
 * Stima di consegna come su Varzi: "Ordinato → Spedito → Consegnato" con le date.
 * Calcolata nel browser (ora corrente) per non mettere in cache date sbagliate.
 */
export function DeliveryEstimate({
  lavorazione,
  transitoMin,
  transitoMax,
  pickup,
}: {
  lavorazione: number;
  transitoMin: number;
  transitoMax: number;
  pickup: boolean;
}) {
  const [dates, setDates] = useState<{ shipped: Date; from: Date; to: Date } | null>(null);

  useEffect(() => {
    const now = new Date();
    // Dopo le 13 l'ordine viene preparato dal giorno lavorativo successivo
    const start = now.getHours() >= 13 || !isWorkingDay(now) ? addWorkingDays(now, 1) : now;
    const shipped = lavorazione > 0 ? addWorkingDays(start, lavorazione - (start === now ? 0 : 1)) : start;
    setDates({ shipped, from: addWorkingDays(shipped, transitoMin), to: addWorkingDays(shipped, transitoMax) });
  }, [lavorazione, transitoMin, transitoMax]);

  if (!dates) return <div className="h-[92px] rounded-2xl bg-paper-warm" />;

  const steps = [
    { icon: PackageCheck, label: "Ordini oggi", date: "Oggi" },
    { icon: Truck, label: "Spedito", date: fmt(dates.shipped) },
    {
      icon: Store,
      label: "Consegnato",
      date: dates.from.toDateString() === dates.to.toDateString() ? fmt(dates.to) : `${fmt(dates.from)} - ${fmt(dates.to)}`,
    },
  ];
  return (
    <div className="rounded-2xl border border-paper-line bg-white p-4">
      <ol className="grid grid-cols-3 gap-2 text-center">
        {steps.map((s, i) => (
          <li key={s.label} className="relative flex flex-col items-center gap-1.5">
            {i > 0 && <span className="absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2 bg-brand-100" aria-hidden />}
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <s.icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-ink-muted">{s.label}</span>
            <span className="text-[13px] font-bold capitalize">{s.date}</span>
          </li>
        ))}
      </ol>
      {pickup && (
        <p className="mt-3 rounded-xl bg-orange-soft px-3 py-2 text-[13px] font-medium text-orange-ink">
          Vai di fretta? Scegli <strong>Ritiro in negozio</strong> al checkout: è gratuito.
        </p>
      )}
    </div>
  );
}
