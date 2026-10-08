"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadgePercent, PackageSearch, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/admin/PageTitle";
import { useConfirm } from "@/components/admin/useConfirm";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { api, errorMessage, revalidateStorefront } from "@/lib/api/client";
import type { Paginated } from "@/lib/types";
import { BulkDiscountModal, type BulkDiscountTarget } from "../BulkDiscountModal";
import { useCategories } from "../categories";
import { DiscountModal } from "../DiscountModal";
import type { AdminListProduct, DiscountTarget } from "../types";
import { mergePricing, pluralize } from "../utils";
import { BulkBar, type BulkAction } from "./BulkBar";
import { DiscountTip, ListSkeleton } from "./ListParts";
import { LIST_QUERY_KEY, PAGE_SIZE, readFilters, toApiQuery, writeFilters, type ListFilters } from "./filters";
import { Pagination } from "./Pagination";
import { ProductCards } from "./ProductCards";
import { ProductFilters } from "./ProductFilters";
import { ProductTable } from "./ProductTable";
import { SelectBox, type RowHandlers } from "./RowParts";
import { StockAlertsPanel } from "./StockAlertsPanel";
import { useProductActions } from "./useProductActions";

const BULK_SUCCESS: Record<Exclude<BulkAction, "discount" | "removeDiscount">, (n: number) => string> = {
  available: (n) => `${pluralize(n, "prodotto è", "prodotti sono")} di nuovo in vendita.`,
  unavailable: (n) => (n === 1 ? "1 prodotto segnato come esaurito." : `${n.toLocaleString("it-IT")} prodotti segnati come esauriti.`),
  feature: (n) => `${pluralize(n, "prodotto messo", "prodotti messi")} in evidenza nella home.`,
  unfeature: (n) => `${pluralize(n, "prodotto tolto", "prodotti tolti")} dall'evidenza.`,
};

export function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const paramString = params.toString();
  const filters = useMemo(() => readFilters(new URLSearchParams(paramString)), [paramString]);
  const showAlerts = params.get("alerts") === "1";
  const showTip = params.get("sconto") === "1";

  const { flat: categories } = useCategories();
  const [confirm, confirmDialog] = useConfirm();
  const searchInput = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<Paginated<AdminListProduct> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [alertsKey, setAlertsKey] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [discountFor, setDiscountFor] = useState<DiscountTarget | null>(null);
  const [bulkTarget, setBulkTarget] = useState<BulkDiscountTarget | null>(null);
  const [bulkBusy, setBulkBusy] = useState<BulkAction | null>(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // --- URL <-> filtri ------------------------------------------------------
  const navigate = useCallback(
    (qs: string, push = false) => {
      const href = qs ? `${pathname}?${qs}` : pathname;
      if (push) router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    },
    [pathname, router]
  );

  // I filtri sostituiscono l'URL; il cambio pagina aggiunge una voce alla cronologia (il tasto Indietro torna alla pagina prima)
  const update = useCallback(
    (patch: Partial<ListFilters>) => {
      const next: ListFilters = { ...filters, ...patch, pagina: patch.pagina ?? 1 };
      const onlyPage = Object.keys(patch).length === 1 && patch.pagina !== undefined;
      navigate(writeFilters(new URLSearchParams(paramString), next), onlyPage);
    },
    [filters, navigate, paramString]
  );

  const removeParam = (key: string) => {
    const next = new URLSearchParams(paramString);
    next.delete(key);
    navigate(next.toString());
  };

  // Ricerca con attesa di 350 ms dopo l'ultimo tasto
  const [search, setSearch] = useState(filters.q);
  const lastQ = useRef(filters.q);
  useEffect(() => {
    if (filters.q !== lastQ.current) {
      lastQ.current = filters.q;
      setSearch(filters.q);
    }
  }, [filters.q]);
  useEffect(() => {
    if (search === lastQ.current) return;
    const t = setTimeout(() => {
      lastQ.current = search;
      update({ q: search });
    }, 350);
    return () => clearTimeout(t);
  }, [search, update]);

  // L'editor torna alla lista con gli stessi filtri
  useEffect(() => {
    try {
      sessionStorage.setItem(LIST_QUERY_KEY, writeFilters(new URLSearchParams(), filters));
    } catch {
      // ignora
    }
  }, [filters]);

  useEffect(() => {
    if (showTip) searchInput.current?.focus();
  }, [showTip]);

  // --- Caricamento ---------------------------------------------------------
  const queryKey = JSON.stringify(toApiQuery(filters));
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api<Paginated<AdminListProduct>>("/products", { query: JSON.parse(queryKey) })
      .then((res) => {
        if (!alive) return;
        setData(res);
        setError(null);
      })
      .catch((e) => alive && setError(errorMessage(e, "Impossibile caricare i prodotti.")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [queryKey, reloadKey]);

  useEffect(() => setSelected(new Set()), [queryKey]);

  // Pagina oltre la fine (es. dopo un'eliminazione): torna all'ultima
  useEffect(() => {
    if (data && data.totalPages > 0 && filters.pagina > data.totalPages) {
      navigate(writeFilters(new URLSearchParams(paramString), { ...filters, pagina: data.totalPages }));
    }
  }, [data, filters, navigate, paramString]);

  // --- Azioni sui singoli prodotti -------------------------------------------
  const patchProduct = useCallback(
    (id: number, patch: Partial<AdminListProduct>) =>
      setData((d) => (d ? { ...d, data: d.data.map((p) => (p.id === id ? { ...p, ...patch } : p)) } : d)),
    []
  );

  const onRemoved = useCallback(
    (id: number) => {
      setSelected((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      reload();
    },
    [reload]
  );
  const actions = useProductActions({ confirm, onPatch: patchProduct, onRemoved });

  const handlers = (p: AdminListProduct): RowHandlers => ({
    onSelect: (checked) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (checked) next.add(p.id);
        else next.delete(p.id);
        return next;
      }),
    onDiscount: () => setDiscountFor(p),
    onToggleAvailable: async (value) => {
      const ok = await actions.setAvailable(p, value);
      if (ok && value) setAlertsKey((k) => k + 1);
    },
    onToggleFeatured: (value) => void actions.setFeatured(p, value),
    onDelete: () => void actions.remove(p),
    busy: {
      available: actions.isBusy(p.id, "available"),
      featured: actions.isBusy(p.id, "featured"),
      delete: actions.isBusy(p.id, "delete"),
    },
  });

  // --- Selezione e azioni di gruppo -------------------------------------------
  const products = data?.data ?? [];
  const allSelected = products.length > 0 && products.every((p) => selected.has(p.id));
  const someSelected = products.some((p) => selected.has(p.id));
  const selectAll = (checked: boolean) => setSelected(checked ? new Set(products.map((p) => p.id)) : new Set());

  const runBulk = async (action: BulkAction) => {
    const ids = [...selected];
    if (!ids.length) return;
    if (action === "discount") {
      setBulkTarget({ kind: "products", ids });
      return;
    }
    if (action === "removeDiscount") {
      const ok = await confirm({
        title: "Togliere lo sconto?",
        message: `Lo sconto verrà tolto da ${pluralize(ids.length, "prodotto selezionato", "prodotti selezionati")}, compresi quelli programmati.`,
        confirmLabel: "Togli sconto",
        danger: true,
      });
      if (!ok) return;
    }
    setBulkBusy(action);
    try {
      if (action === "removeDiscount") {
        const res = await api<{ updated: number }>("/products/bulk-discount", {
          method: "POST",
          body: { productIds: ids, remove: true },
        });
        toast.success(`Sconto tolto da ${pluralize(res.updated ?? ids.length, "prodotto", "prodotti")}.`);
      } else {
        const change =
          action === "available" || action === "unavailable"
            ? { available: action === "available" }
            : { inEvidenza: action === "feature" };
        const res = await api<{ updated: number }>("/products/bulk", {
          method: "PATCH",
          body: { productIds: ids, ...change },
        });
        toast.success(BULK_SUCCESS[action](res.updated ?? ids.length));
        if (action === "available") setAlertsKey((k) => k + 1);
      }
      revalidateStorefront(["products"]);
      reload();
    } catch (e) {
      toast.error(errorMessage(e, "Non è stato possibile aggiornare i prodotti."));
    } finally {
      setBulkBusy(null);
    }
  };

  const hasFilters = !!(filters.q || filters.categoria || filters.disponibilita || filters.offerta || filters.evidenza);
  const resetFilters = () => {
    lastQ.current = "";
    setSearch("");
    update({ q: "", categoria: null, disponibilita: "", offerta: false, evidenza: false });
  };

  return (
    <div className={selected.size ? "pb-28" : undefined}>
      <PageTitle
        title="Prodotti"
        description={
          data && !hasFilters
            ? `${pluralize(data.totalProducts, "prodotto", "prodotti")} nel catalogo. Premi «Sconto» su un prodotto per metterlo in offerta.`
            : "Prezzi, sconti, disponibilità e foto dei tuoi articoli."
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setBulkTarget({ kind: "category", categoryId: filters.categoria })}>
              <BadgePercent className="h-4 w-4 text-magenta" /> Sconto su categoria
            </Button>
            <LinkButton href="/dashboard/prodotti/nuovo">
              <Plus className="h-4 w-4" /> Nuovo prodotto
            </LinkButton>
          </>
        }
      />

      {showTip && <DiscountTip onClose={() => removeParam("sconto")} />}

      <StockAlertsPanel
        forceOpen={showAlerts}
        refreshKey={alertsKey}
        onMadeAvailable={(id) => patchProduct(id, { available: true })}
      />

      <ProductFilters
        ref={searchInput}
        filters={filters}
        search={search}
        onSearch={setSearch}
        onChange={update}
        onReset={resetFilters}
        categories={categories}
      />

      {error && !data ? (
        <div className="card p-8 text-center">
          <p className="font-semibold">{error}</p>
          <Button variant="outline" className="mt-4" onClick={reload}>
            Riprova
          </Button>
        </div>
      ) : !data ? (
        <ListSkeleton />
      ) : products.length === 0 ? (
        <div className="card">
          {hasFilters ? (
            <EmptyState
              icon={<PackageSearch className="h-7 w-7" />}
              title="Nessun prodotto trovato"
              text="Prova a cambiare la ricerca o a togliere qualche filtro."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Azzera filtri
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<PackageSearch className="h-7 w-7" />}
              title="Il catalogo è vuoto"
              text="Aggiungi il primo prodotto oppure importali tutti insieme da un file Excel."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <LinkButton href="/dashboard/prodotti/nuovo">
                    <Plus className="h-4 w-4" /> Nuovo prodotto
                  </LinkButton>
                  <LinkButton href="/dashboard/import-prodotti" variant="outline">
                    <Upload className="h-4 w-4" /> Importa da file
                  </LinkButton>
                </div>
              }
            />
          )}
        </div>
      ) : (
        <div className={loading ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          <div className="mb-3 flex items-center justify-between gap-3 xl:hidden">
            <label className="flex items-center gap-2.5 text-sm font-semibold text-ink-soft">
              <SelectBox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={selectAll}
                label="Seleziona tutti i prodotti della pagina"
              />
              Seleziona tutti
            </label>
            <span className="text-sm text-ink-muted">{pluralize(data.totalProducts, "prodotto", "prodotti")}</span>
          </div>
          <div className="hidden xl:block">
            <ProductTable
              products={products}
              selected={selected}
              allSelected={allSelected}
              someSelected={someSelected}
              onSelectAll={selectAll}
              handlers={handlers}
            />
          </div>
          <div className="xl:hidden">
            <ProductCards products={products} selected={selected} handlers={handlers} />
          </div>
          <Pagination
            page={filters.pagina}
            totalPages={data.totalPages}
            total={data.totalProducts}
            pageSize={PAGE_SIZE}
            onChange={(pagina) => {
              update({ pagina });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
          <p className="mt-6 text-center text-sm text-ink-muted">
            Devi caricare tanti prodotti?{" "}
            <Link href="/dashboard/import-prodotti" className="font-semibold text-brand-600 hover:text-brand-700">
              Importali da Excel o CSV
            </Link>
          </p>
        </div>
      )}

      <BulkBar count={selected.size} busy={bulkBusy} onAction={runBulk} onClear={() => setSelected(new Set())} />

      <DiscountModal
        product={discountFor}
        onClose={() => setDiscountFor(null)}
        onSaved={(updated) =>
          setData((d) => (d ? { ...d, data: d.data.map((p) => (p.id === updated.id ? mergePricing(p, updated) : p)) } : d))
        }
      />
      <BulkDiscountModal
        target={bulkTarget}
        categories={categories}
        onClose={() => setBulkTarget(null)}
        onDone={reload}
      />
      {confirmDialog}
    </div>
  );
}
