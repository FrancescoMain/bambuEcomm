"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Printer, RefreshCw, SearchX, ShoppingBag, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { Order, OrderStatus, Product, StoreSettings } from "@/lib/types";
import { api, errorMessage } from "@/lib/api/client";
import { ORDER_STATUS_LABEL, formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { PageTitle } from "@/components/admin/PageTitle";
import { useConfirm } from "@/components/admin/useConfirm";
import { cn } from "@/lib/cn";
import { Callout } from "../Callout";
import { FilterTabs } from "../FilterTabs";
import { Pagination } from "../Pagination";
import { SearchInput } from "../SearchInput";
import { useAsync } from "../useAsync";
import { useQueryParams } from "../useQueryParams";
import { OrderDetail } from "./OrderDetail";
import { OrdersList, OrdersListSkeleton } from "./OrdersList";
import { PackingSlip } from "./PackingSlip";
import {
  ORDER_TABS,
  type OrderTabKey,
  type OrdersResponse,
  type StatusCounts,
  canCancel,
  deliveryOf,
  isPaidOnline,
  statusChangeWarning,
  statusSuccessMessage,
  tabCount,
} from "./orderUtils";

const PAGE_SIZE = 20;
type SortOrder = "asc" | "desc";

type ListResult = { orders: Order[]; total: number; totalPages: number; counts: StatusCounts };

const byDate = (sort: SortOrder) => (a: Order, b: Order) => {
  const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  return sort === "asc" ? diff : -diff;
};

/** I primi `need` ordini di uno stato (più pagine dell'API se servono) */
async function fetchHead(status: OrderStatus, need: number, q: string, sortOrder: SortOrder) {
  const limit = Math.min(100, need);
  const orders: Order[] = [];
  let total = 0;
  let counts: StatusCounts = {};
  for (let page = 1; ; page++) {
    const res = await api<OrdersResponse>("/orders", { query: { status, q, page, limit, sortOrder } });
    orders.push(...res.data);
    total = res.totalOrders;
    counts = res.countsByStatus;
    if (orders.length >= need || page >= res.totalPages) break;
  }
  return { orders, total, counts };
}

/**
 * Le schede con più stati (es. "Da preparare" = pagati + contrassegno)
 * uniscono più richieste all'API mantenendo ordinamento e paginazione.
 */
async function fetchOrders(tabKey: OrderTabKey, page: number, q: string, sortOrder: SortOrder): Promise<ListResult> {
  const tab = ORDER_TABS.find((t) => t.key === tabKey) ?? ORDER_TABS[0];
  if (tab.statuses === "all" || tab.statuses.length === 1) {
    const status = tab.statuses === "all" ? "all" : tab.statuses[0];
    const res = await api<OrdersResponse>("/orders", { query: { status, q, page, limit: PAGE_SIZE, sortOrder } });
    return { orders: res.data, total: res.totalOrders, totalPages: res.totalPages, counts: res.countsByStatus };
  }
  const need = page * PAGE_SIZE;
  const heads = await Promise.all(tab.statuses.map((s) => fetchHead(s, need, q, sortOrder)));
  const merged = heads.flatMap((h) => h.orders).sort(byDate(sortOrder));
  const total = heads.reduce((sum, h) => sum + h.total, 0);
  return {
    orders: merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
    counts: heads[0]?.counts ?? {},
  };
}

/** Nomi dei tipi di variante ("Colore", "Taglia") per mostrare "Colore: Rosso" */
function useVariantTypeNames(order: Order | null) {
  const [names, setNames] = useState<Record<string, string>>({});
  const productIds = useMemo(() => {
    if (!order) return "";
    const ids = order.orderItems
      .filter((i) => i.selectedVariants && Object.keys(i.selectedVariants).length > 0)
      .map((i) => i.productId);
    return Array.from(new Set(ids)).join(",");
  }, [order]);

  useEffect(() => {
    if (!productIds) return;
    let alive = true;
    Promise.all(productIds.split(",").map((id) => api<Product>(`/products/${id}`).catch(() => null))).then((products) => {
      if (!alive) return;
      const map: Record<string, string> = {};
      for (const p of products) p?.varianti?.forEach((t) => (map[String(t.id)] = t.nome.trim()));
      setNames((prev) => ({ ...prev, ...map }));
    });
    return () => {
      alive = false;
    };
  }, [productIds]);

  return names;
}

let settingsCache: Promise<StoreSettings | null> | null = null;
const loadShopSettings = () => (settingsCache ??= api<StoreSettings>("/settings").catch(() => null));

export function OrdersView() {
  const [params, setParams] = useQueryParams();
  const tabParam = params.get("tab");
  const tabKey: OrderTabKey = ORDER_TABS.some((t) => t.key === tabParam) ? (tabParam as OrderTabKey) : "da-preparare";
  const tab = ORDER_TABS.find((t) => t.key === tabKey)!;
  const q = params.get("q") ?? "";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const sortOrder: SortOrder = params.get("ordine") === "meno-recenti" ? "asc" : "desc";
  const selectedId = parseInt(params.get("id") ?? "", 10) || null;

  const list = useAsync(() => fetchOrders(tabKey, page, q, sortOrder), [tabKey, page, q, sortOrder]);
  const counts = list.data?.counts;

  // --- dettaglio ordine (anche da link diretto ?id=123 delle email)
  const [detail, setDetail] = useState<Order | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailVersion, setDetailVersion] = useState(0);
  const listOrders = useRef<Order[] | undefined>(undefined);
  useEffect(() => {
    listOrders.current = list.data?.orders;
  }, [list.data]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    let alive = true;
    setDetailError(null);
    setDetail((prev) => (prev?.id === selectedId ? prev : listOrders.current?.find((o) => o.id === selectedId) ?? null));
    api<Order>(`/orders/${selectedId}`)
      .then((o) => alive && setDetail(o))
      .catch((e) => alive && setDetailError(errorMessage(e, "Ordine non trovato.")));
    return () => {
      alive = false;
    };
  }, [selectedId, detailVersion]);

  const typeNames = useVariantTypeNames(detail);
  const [shopSettings, setShopSettings] = useState<StoreSettings | null>(null);
  useEffect(() => {
    if (selectedId) void loadShopSettings().then(setShopSettings);
  }, [selectedId]);

  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const reloadList = list.reload;
  const refreshAll = useCallback(() => {
    reloadList();
    setDetailVersion((v) => v + 1);
  }, [reloadList]);

  // Tornando sulla scheda del browser la lista si aggiorna da sola (nuovi ordini)
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && reloadList();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reloadList]);

  const openOrder = useCallback((o: Order) => setParams({ id: o.id }), [setParams]);
  const closeOrder = useCallback(() => setParams({ id: null }), [setParams]);

  const changeStatus = async (order: Order, status: OrderStatus, tracking?: string, confirmed = false) => {
    if (!confirmed && status === "SHIPPED" && deliveryOf(order) === "spedizione" && !tracking && !order.trackingNumber) {
      const ok = await confirm({
        title: "Spedire senza numero di tracking?",
        message: "Il cliente riceverà l'email di spedizione senza il link per seguire il pacco. Potrai aggiungere il tracking anche dopo: gli arriverà una seconda email.",
        confirmLabel: "Sì, segna come spedito",
      });
      if (!ok) return;
    }
    setBusy(`status:${status}`);
    try {
      if (tracking) {
        await api(`/orders/${order.id}/tracking`, { method: "PATCH", body: { trackingNumber: tracking } });
      }
      const res = await api<{ message: string; order: Order }>(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: { status },
      });
      setDetail(res.order);
      toast.success(statusSuccessMessage(order, status));
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e, "Non è stato possibile aggiornare l'ordine."));
    } finally {
      setBusy(null);
    }
  };

  const manualStatus = async (order: Order, status: OrderStatus) => {
    const ok = await confirm({
      title: `Cambiare lo stato in «${ORDER_STATUS_LABEL[status] ?? status}»?`,
      message: statusChangeWarning(order, status),
      confirmLabel: "Cambia stato",
      danger: status === "CANCELLED" || status === "REFUNDED",
    });
    if (ok) await changeStatus(order, status, undefined, true);
  };

  const saveTracking = async (order: Order, trackingNumber: string) => {
    setBusy("tracking");
    try {
      const res = await api<{ message: string; order: Order }>(`/orders/${order.id}/tracking`, {
        method: "PATCH",
        body: { trackingNumber },
      });
      setDetail(res.order);
      toast.success(
        order.status === "SHIPPED" ? "Tracking salvato e inviato al cliente via email." : "Numero di tracking salvato."
      );
    } catch (e) {
      toast.error(errorMessage(e, "Non è stato possibile salvare il tracking."));
    } finally {
      setBusy(null);
    }
  };

  const cancelOrder = async (order: Order) => {
    const refund = isPaidOnline(order);
    const ok = await confirm({
      title: refund ? `Annullare e rimborsare l'ordine #${order.id}?` : `Annullare l'ordine #${order.id}?`,
      message: (
        <div className="space-y-2">
          {refund ? (
            <p>
              Il cliente riceverà il <strong>rimborso completo di {formatPrice(order.totalAmount)}</strong> sul metodo di
              pagamento usato (visibile in 5-10 giorni lavorativi) e un&apos;email di conferma.
            </p>
          ) : (
            <p>Il cliente riceverà un&apos;email di annullamento.</p>
          )}
          {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
            <p>L&apos;ordine risulta già spedito: se il cliente sta restituendo la merce, valuta di aspettare il reso.</p>
          )}
          <p className="font-semibold">L&apos;operazione non si può annullare.</p>
        </div>
      ),
      confirmLabel: refund ? "Annulla e rimborsa" : "Annulla ordine",
      danger: true,
    });
    if (!ok) return;
    setBusy("cancel");
    try {
      const res = await api<{ message: string }>(`/orders/${order.id}/cancel`, { method: "PATCH" });
      toast.success(res.message || "Ordine annullato.");
      refreshAll();
    } catch (e) {
      toast.error(errorMessage(e, "Non è stato possibile annullare l'ordine."));
    } finally {
      setBusy(null);
    }
  };

  const print = () => {
    // Il pannello aperto blocca lo scroll della pagina: in stampa servono tutte le pagine
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "";
    window.print();
    document.body.style.overflow = overflow;
  };

  const data = list.data;
  const searching = q.trim().length > 0;

  let content: React.ReactNode;
  if (list.error && !data) {
    content = (
      <Callout tone="danger" title="Impossibile caricare gli ordini">
        {list.error}{" "}
        <button type="button" onClick={list.reload} className="font-semibold underline">
          Riprova
        </button>
      </Callout>
    );
  } else if (!data) {
    content = <OrdersListSkeleton />;
  } else if (!data.orders.length) {
    content = (
      <div className="card">
        {searching ? (
          <EmptyState
            icon={<SearchX className="h-7 w-7" />}
            title="Nessun ordine trovato"
            text={`Nessun risultato per «${q}» in «${tab.label}».`}
            action={
              tabKey !== "tutti" ? (
                <Button variant="secondary" onClick={() => setParams({ tab: "tutti", page: null })}>
                  Cerca in tutti gli ordini
                </Button>
              ) : undefined
            }
          />
        ) : (
          <EmptyState
            icon={<ShoppingBag className="h-7 w-7" />}
            title={tab.empty.title}
            text={tab.empty.text}
            action={
              tabKey === "da-preparare" ? (
                <Button variant="secondary" onClick={() => setParams({ tab: "tutti", page: null })}>
                  Vedi tutti gli ordini
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    );
  } else {
    content = (
      <div className={cn("transition-opacity", list.loading && "opacity-60")} aria-busy={list.loading}>
        <OrdersList orders={data.orders} selectedId={selectedId} onOpen={openOrder} />
      </div>
    );
  }

  return (
    <div className="print:[&_[role=dialog]]:hidden">
      <div className="print:hidden">
        <PageTitle
          title="Ordini"
          description="Prepara, spedisci e tieni aggiornati i clienti: ogni cambio di stato invia l'email giusta in automatico."
          actions={
            <Button variant="outline" onClick={refreshAll} loading={list.loading && !!data}>
              {!(list.loading && data) && <RefreshCw className="h-4 w-4" />}
              Aggiorna
            </Button>
          }
        />

        <FilterTabs
          label="Filtra gli ordini per stato"
          value={tabKey}
          onChange={(key) => setParams({ tab: key === "da-preparare" ? null : key, page: null })}
          items={ORDER_TABS.map((t) => ({
            value: t.key,
            label: t.label,
            count: tabCount(t, counts),
            highlight: t.highlight,
          }))}
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={q}
            onChange={(value) => setParams({ q: value.trim() || null, page: null })}
            placeholder="Cerca per numero, nome, email o telefono"
            label="Cerca ordini"
            className="sm:max-w-md sm:flex-1"
          />
          <div className="flex items-center gap-3 sm:ml-auto">
            {data && (
              <p className="text-sm text-ink-muted" aria-live="polite">
                {data.total === 1 ? "1 ordine" : `${data.total} ordini`}
              </p>
            )}
            <select
              aria-label="Ordina"
              value={sortOrder === "asc" ? "meno-recenti" : "recenti"}
              onChange={(e) => setParams({ ordine: e.target.value === "meno-recenti" ? "meno-recenti" : null, page: null })}
              className="field ml-auto w-auto py-2 text-sm sm:ml-0"
            >
              <option value="recenti">Più recenti prima</option>
              <option value="meno-recenti">Meno recenti prima</option>
            </select>
          </div>
        </div>

        {tabKey === "tutti" && !!counts?.AWAITING_PAYMENT && (
          <p className="mt-3 text-xs text-ink-muted">
            In «Tutti» compaiono anche i checkout abbandonati (stato «In attesa di pagamento»): non vanno preparati.
          </p>
        )}

        <div className="mt-5">{content}</div>

        {data && (
          <Pagination page={page} totalPages={data.totalPages} onChange={(p) => setParams({ page: p > 1 ? p : null })} />
        )}
      </div>

      {detail && <PackingSlip order={detail} settings={shopSettings} typeNames={typeNames} />}

      <Drawer
        open={!!selectedId}
        onClose={closeOrder}
        title={selectedId ? `Ordine #${selectedId}` : "Ordine"}
        className="sm:max-w-xl lg:max-w-2xl"
        footer={
          detail ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={print}>
                <Printer className="h-4 w-4" /> Stampa distinta
              </Button>
              {canCancel(detail) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-magenta-ink hover:bg-magenta-soft hover:text-magenta-ink"
                  loading={busy === "cancel"}
                  disabled={!!busy && busy !== "cancel"}
                  onClick={() => cancelOrder(detail)}
                >
                  {busy !== "cancel" && <Undo2 className="h-4 w-4" />}
                  {isPaidOnline(detail) ? "Annulla e rimborsa" : "Annulla ordine"}
                </Button>
              )}
            </div>
          ) : undefined
        }
      >
        {detail ? (
          <OrderDetail
            order={detail}
            typeNames={typeNames}
            busy={busy}
            onStatus={(status, tracking) => changeStatus(detail, status, tracking)}
            onSaveTracking={(tracking) => saveTracking(detail, tracking)}
            onManualStatus={(status) => manualStatus(detail, status)}
          />
        ) : detailError ? (
          <EmptyState
            icon={<SearchX className="h-7 w-7" />}
            title="Ordine non trovato"
            text={detailError}
            action={
              <Button variant="outline" onClick={closeOrder}>
                Torna agli ordini
              </Button>
            }
          />
        ) : (
          <div className="space-y-4 p-5" aria-label="Caricamento ordine">
            <Skeleton className="h-16" />
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
            <Skeleton className="h-28" />
          </div>
        )}
      </Drawer>
      {confirmDialog}
    </div>
  );
}
