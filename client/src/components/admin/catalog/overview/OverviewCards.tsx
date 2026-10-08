"use client";

import Link from "next/link";
import {
  BadgePercent,
  BellRing,
  Check,
  ChevronRight,
  Image as ImageIcon,
  Inbox,
  Mail,
  PackagePlus,
  PartyPopper,
  RotateCcw,
  ShoppingBag,
  Star,
  Ticket,
  Trophy,
} from "lucide-react";
import { formatDateTime, formatPrice, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { DashboardStats } from "../types";
import { pluralize } from "../utils";

type Todo = DashboardStats["todo"];

const TODO_ITEMS: {
  key: Exclude<keyof Todo, "iscrittiNewsletter">;
  one: string;
  many: string;
  done: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: "ordiniDaEvadere",
    one: "ordine da preparare e spedire",
    many: "ordini da preparare e spedire",
    done: "Nessun ordine da spedire",
    href: "/dashboard/ordini",
    icon: ShoppingBag,
  },
  {
    key: "messaggiNonLetti",
    one: "messaggio da leggere",
    many: "messaggi da leggere",
    done: "Nessun messaggio nuovo",
    href: "/dashboard/messaggi",
    icon: Inbox,
  },
  {
    key: "recensioniDaApprovare",
    one: "recensione da approvare",
    many: "recensioni da approvare",
    done: "Nessuna recensione in attesa",
    href: "/dashboard/recensioni",
    icon: Star,
  },
  {
    key: "recessiDaGestire",
    one: "richiesta di reso da gestire",
    many: "richieste di reso da gestire",
    done: "Nessun reso da gestire",
    href: "/dashboard/recessi",
    icon: RotateCcw,
  },
  {
    key: "richiesteDisponibilita",
    one: "cliente aspetta un prodotto esaurito",
    many: "clienti aspettano un prodotto esaurito",
    done: "Nessun cliente in attesa di disponibilità",
    href: "/dashboard/prodotti?alerts=1",
    icon: BellRing,
  },
];

/** Lista "Da fare" costruita dai contatori del riepilogo */
export function TodoCard({ todo }: { todo: Todo }) {
  const pending = TODO_ITEMS.filter((i) => todo[i.key] > 0);
  return (
    <section className="card flex flex-col p-5 sm:p-6" aria-labelledby="da-fare">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 id="da-fare" className="text-lg font-bold">
          Da fare
        </h2>
        {pending.length > 0 && (
          <span className="rounded-full bg-orange-soft px-2.5 py-1 text-xs font-bold text-orange-ink">
            {pluralize(pending.length, "cosa", "cose")}
          </span>
        )}
      </div>
      {pending.length === 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-brand-50 p-3 text-sm font-semibold text-brand-800">
          <PartyPopper className="h-5 w-5 shrink-0" /> Tutto in ordine, ottimo lavoro!
        </div>
      )}
      <ul className="mb-3 space-y-1">
        {TODO_ITEMS.map((item) => {
          const n = todo[item.key];
          const Icon = item.icon;
          if (n === 0) {
            return (
              <li key={item.key} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-ink-muted">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Check className="h-4 w-4" />
                </span>
                {item.done}
              </li>
            );
          }
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 rounded-xl px-2 py-2 text-[15px] transition hover:bg-paper"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-soft text-orange-ink">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="font-extrabold text-ink">{n}</strong>{" "}
                  <span className="text-ink-soft">{n === 1 ? item.one : item.many}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto border-t border-paper-line pt-3">
        <Link
          href="/dashboard/newsletter"
          className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-ink-soft transition hover:bg-paper hover:text-ink"
        >
          <Mail className="h-4 w-4 text-ink-muted" />
          <span className="flex-1">
            <strong className="text-ink">{todo.iscrittiNewsletter.toLocaleString("it-IT")}</strong>{" "}
            {todo.iscrittiNewsletter === 1 ? "iscritto" : "iscritti"} alla newsletter
          </span>
          <ChevronRight className="h-4 w-4 text-ink-faint" />
        </Link>
      </div>
    </section>
  );
}

const DELIVERY: Record<string, string> = {
  spedizione: "Spedizione",
  ritiro: "Ritiro in negozio",
  giornata: "Consegna in giornata",
};

export function RecentOrders({ orders }: { orders: DashboardStats["recentOrders"] }) {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="ultimi-ordini">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="ultimi-ordini" className="text-lg font-bold">
          Ultimi ordini
        </h2>
        <Link href="/dashboard/ordini" className="text-sm font-bold text-brand-600 hover:text-brand-700">
          Vedi tutti
        </Link>
      </div>
      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">Ancora nessun ordine: appena arriva lo trovi qui.</p>
      ) : (
        <ul className="divide-y divide-paper-line">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/dashboard/ordini?id=${o.id}`}
                className="-mx-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-2 py-3 transition hover:bg-paper"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">
                    <span className="text-ink-muted">#{o.id}</span> {o.cliente}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {formatDateTime(o.createdAt)}
                    {o.metodoConsegna ? ` · ${DELIVERY[o.metodoConsegna] ?? o.metodoConsegna}` : ""}
                  </p>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", ORDER_STATUS_TONE[o.status] ?? "bg-paper-warm text-ink-soft")}>
                  {ORDER_STATUS_LABEL[o.status] ?? o.status}
                </span>
                <span className="w-20 text-right text-[15px] font-bold tabular-nums">{formatPrice(o.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function TopProducts({ products }: { products: DashboardStats["topProducts"] }) {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="piu-venduti">
      <h2 id="piu-venduti" className="mb-3 flex items-center gap-2 text-lg font-bold">
        <Trophy className="h-5 w-5 text-orange" /> I più venduti
      </h2>
      {products.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">Le vendite dei prodotti appariranno qui.</p>
      ) : (
        <ol className="space-y-1">
          {products.map((p, i) => (
            <li key={p.id}>
              <Link href={`/dashboard/prodotti/${p.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-paper">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold",
                    i === 0 ? "bg-orange-soft text-orange-ink" : "bg-paper-warm text-ink-soft"
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-semibold">{p.name}</span>
                  <span className="text-xs text-ink-muted">{pluralize(p.sold, "pezzo venduto", "pezzi venduti")}</span>
                </span>
                <span className="text-sm font-bold tabular-nums">{formatPrice(p.revenue)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const ACTIONS = [
  {
    href: "/dashboard/prodotti/nuovo",
    title: "Nuovo prodotto",
    text: "Aggiungi un articolo al catalogo",
    icon: PackagePlus,
    tone: "bg-brand-50 text-brand-700",
  },
  {
    href: "/dashboard/prodotti?sconto=1",
    title: "Applica uno sconto",
    text: "Metti in offerta un prodotto",
    icon: BadgePercent,
    tone: "bg-magenta-soft text-magenta-ink",
  },
  {
    href: "/dashboard/promozioni?tab=codici",
    title: "Crea un codice sconto",
    text: "Da usare nel carrello",
    icon: Ticket,
    tone: "bg-sky-soft text-sky-ink",
  },
  {
    href: "/dashboard/impostazioni",
    title: "Modifica banner home",
    text: "Foto e messaggi in prima pagina",
    icon: ImageIcon,
    tone: "bg-orange-soft text-orange-ink",
  },
];

export function QuickActions() {
  return (
    <section aria-labelledby="azioni-rapide">
      <h2 id="azioni-rapide" className="sr-only">
        Azioni rapide
      </h2>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <li key={a.href}>
              <Link
                href={a.href}
                className="card flex h-full flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lift sm:flex-row sm:items-center"
              >
                <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", a.tone)}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold leading-tight">{a.title}</span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{a.text}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
