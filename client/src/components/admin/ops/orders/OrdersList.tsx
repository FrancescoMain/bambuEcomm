"use client";

import { ChevronRight } from "lucide-react";
import type { Order } from "@/lib/types";
import { formatDateTime, formatPrice, plural } from "@/lib/format";
import { Skeleton } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { DeliveryBadge, NoteBadge, PaymentBadge, StatusBadge } from "./OrderBadges";
import { customerEmail, customerName, itemCount } from "./orderUtils";

/** Elenco ordini: schede su telefono, tabella da tablet in su */
export function OrdersList({
  orders,
  selectedId,
  onOpen,
}: {
  orders: Order[];
  selectedId: number | null;
  onOpen: (order: Order) => void;
}) {
  return (
    <>
      <ul className="space-y-3 md:hidden">
        {orders.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => onOpen(o)}
              className={cn(
                "card block w-full p-4 text-left transition active:scale-[0.99]",
                selectedId === o.id && "border-brand-300 ring-2 ring-brand-500/20"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-extrabold">#{o.id}</p>
                  <p className="text-xs text-ink-muted">{formatDateTime(o.createdAt)}</p>
                </div>
                <StatusBadge order={o} />
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{customerName(o)}</p>
                  <p className="text-sm text-ink-muted">{plural(itemCount(o), "articolo", "articoli")}</p>
                </div>
                <p className="shrink-0 text-lg font-extrabold">{formatPrice(o.totalAmount)}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <DeliveryBadge order={o} />
                <PaymentBadge order={o} />
                {o.note && <NoteBadge />}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-paper-line bg-paper text-xs font-bold uppercase tracking-wide text-ink-muted">
            <tr>
              <th scope="col" className="px-4 py-3">
                Ordine
              </th>
              <th scope="col" className="px-3 py-3">
                Cliente
              </th>
              <th scope="col" className="px-3 py-3">
                Consegna e pagamento
              </th>
              <th scope="col" className="px-3 py-3 text-right">
                Totale
              </th>
              <th scope="col" className="px-3 py-3">
                Stato
              </th>
              <th scope="col" className="w-10 px-3 py-3">
                <span className="sr-only">Apri</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line">
            {orders.map((o) => (
              <tr
                key={o.id}
                onClick={() => onOpen(o)}
                className={cn(
                  "group cursor-pointer transition hover:bg-paper",
                  selectedId === o.id && "bg-brand-50/60 hover:bg-brand-50"
                )}
              >
                <td className="whitespace-nowrap px-4 py-3.5 align-top">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(o);
                    }}
                    className="text-[15px] font-extrabold text-ink hover:text-brand-600"
                    aria-label={`Apri ordine numero ${o.id}`}
                  >
                    #{o.id}
                  </button>
                  <p className="text-xs text-ink-muted">{formatDateTime(o.createdAt)}</p>
                </td>
                <td className="max-w-[16rem] px-3 py-3.5 align-top">
                  <p className="truncate font-semibold">{customerName(o)}</p>
                  <p className="truncate text-xs text-ink-muted">{customerEmail(o) || "—"}</p>
                </td>
                <td className="px-3 py-3.5 align-top">
                  <div className="flex flex-wrap gap-1.5">
                    <DeliveryBadge order={o} />
                    <PaymentBadge order={o} />
                    {o.note && <NoteBadge />}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-right align-top">
                  <p className="font-bold">{formatPrice(o.totalAmount)}</p>
                  <p className="text-xs text-ink-muted">{plural(itemCount(o), "articolo", "articoli")}</p>
                </td>
                <td className="px-3 py-3.5 align-top">
                  <StatusBadge order={o} />
                </td>
                <td className="px-3 py-3.5 align-middle">
                  <ChevronRight className="h-4 w-4 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function OrdersListSkeleton() {
  return (
    <div aria-hidden>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <div className="card hidden space-y-0 divide-y divide-paper-line overflow-hidden md:block">
        <div className="h-11 bg-paper" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-6 px-4 py-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
