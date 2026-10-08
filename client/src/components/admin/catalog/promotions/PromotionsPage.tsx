"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BadgePercent, Ticket } from "lucide-react";
import { PageTitle } from "@/components/admin/PageTitle";
import { api, errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import type { Paginated } from "@/lib/types";
import type { AdminListProduct, Coupon } from "../types";
import { CouponsTab } from "./CouponsTab";
import { SaleProductsTab } from "./SaleProductsTab";

type Tab = "offerte" | "codici";

export interface Loadable<T> {
  data: T | null;
  error: string | null;
  reload: () => void;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

function useLoad<T>(path: string, query?: Record<string, unknown>): Loadable<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const queryKey = JSON.stringify(query ?? {});
  useEffect(() => {
    let alive = true;
    api<T>(path, { query: JSON.parse(queryKey) })
      .then((res) => {
        if (!alive) return;
        setData(res);
        setError(null);
      })
      .catch((e) => alive && setError(errorMessage(e, "Impossibile caricare i dati.")));
    return () => {
      alive = false;
    };
  }, [path, queryKey, key]);
  const reload = useCallback(() => setKey((k) => k + 1), []);
  return { data, error, reload, setData };
}

export function PromotionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab: Tab = params.get("tab") === "codici" ? "codici" : "offerte";

  const sale = useLoad<Paginated<AdminListProduct>>("/products", { onSale: "true", limit: 100, sort: "discount" });
  const coupons = useLoad<Coupon[]>("/coupons");

  const select = (next: Tab) => {
    const qs = new URLSearchParams(params.toString());
    if (next === "codici") qs.set("tab", "codici");
    else qs.delete("tab");
    const s = qs.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  const tabs: { id: Tab; label: string; short: string; count: number | null; icon: React.ReactNode }[] = [
    {
      id: "offerte",
      label: "Prodotti in offerta",
      short: "In offerta",
      count: sale.data ? sale.data.totalProducts : null,
      icon: <BadgePercent className="h-4 w-4" />,
    },
    {
      id: "codici",
      label: "Codici sconto",
      short: "Codici sconto",
      count: coupons.data ? coupons.data.length : null,
      icon: <Ticket className="h-4 w-4" />,
    },
  ];

  return (
    <div>
      <PageTitle
        title="Sconti e coupon"
        description="I prodotti scontati in questo momento e i codici sconto che i clienti possono usare nel carrello."
      />
      <div
        role="tablist"
        aria-label="Tipo di promozione"
        className="mb-5 flex gap-1 overflow-x-auto border-b border-paper-line scrollbar-none"
      >
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={active}
              aria-controls={`pannello-${t.id}`}
              onClick={() => select(t.id)}
              className={cn(
                "-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-[15px] font-semibold transition sm:px-4",
                active ? "border-brand-600 text-ink" : "border-transparent text-ink-muted hover:text-ink"
              )}
            >
              {t.icon}
              <span className="sm:hidden">{t.short}</span>
              <span className="hidden sm:inline">{t.label}</span>
              {t.count !== null && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    active ? (t.id === "offerte" ? "bg-magenta-soft text-magenta-ink" : "bg-brand-50 text-brand-700") : "bg-paper-warm text-ink-muted"
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`pannello-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "offerte" ? <SaleProductsTab state={sale} /> : <CouponsTab state={coupons} />}
      </div>
    </div>
  );
}
