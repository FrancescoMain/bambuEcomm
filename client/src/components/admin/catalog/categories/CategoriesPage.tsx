"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsDownUp, ChevronsUpDown, FolderTree, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/admin/PageTitle";
import { useConfirm } from "@/components/admin/useConfirm";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { api, ApiError, errorMessage, revalidateStorefront } from "@/lib/api/client";
import type { CategoryNode } from "@/lib/types";
import { BulkDiscountModal, type BulkDiscountTarget } from "../BulkDiscountModal";
import { useCategories } from "../categories";
import { pluralize } from "../utils";
import { CategoryModal, type CategoryDraft } from "./CategoryModal";
import { CategoryRow } from "./CategoryRow";

export function CategoriesPage() {
  const { categories, setCategories, tree, flat, loading, error, reload } = useCategories();
  const [confirm, confirmDialog] = useConfirm();
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [discount, setDiscount] = useState<BulkDiscountTarget | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<number | null>(null);
  const initialized = useRef(false);

  // All'apertura le categorie principali sono aperte
  useEffect(() => {
    if (initialized.current || !categories.length) return;
    initialized.current = true;
    setExpanded(new Set(categories.filter((c) => c.childrenCount > 0).map((c) => c.id)));
  }, [categories]);

  const withChildren = useMemo(() => flat.filter((c) => c.node.children.length > 0).map((c) => c.id), [flat]);
  const allOpen = withChildren.length > 0 && withChildren.every((id) => expanded.has(id));

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const move = async (node: CategoryNode, siblings: CategoryNode[], dir: -1 | 1) => {
    const index = siblings.findIndex((s) => s.id === node.id);
    const target = index + dir;
    if (index < 0 || target < 0 || target >= siblings.length) return;
    const reordered = [...siblings];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const order = reordered.map((s, i) => ({ id: s.id, ordine: i + 1 }));
    const byId = new Map(order.map((o) => [o.id, o.ordine]));
    setCategories((prev) => prev.map((c) => (byId.has(c.id) ? { ...c, ordine: byId.get(c.id) ?? c.ordine } : c)));
    try {
      await api("/categories/reorder", { method: "PATCH", body: { order } });
      revalidateStorefront(["categories", "products"]);
    } catch (e) {
      toast.error(errorMessage(e, "Non è stato possibile cambiare l'ordine."));
      void reload();
    }
  };

  const remove = async (node: CategoryNode) => {
    const ok = await confirm({
      title: `Eliminare «${node.name}»?`,
      message: "La categoria sparirà dal menu del negozio. L'operazione non si può annullare.",
      confirmLabel: "Elimina categoria",
      danger: true,
    });
    if (!ok) return;
    setBusy(node.id);
    try {
      await api(`/categories/${node.id}`, { method: "DELETE" });
      revalidateStorefront(["categories", "products"]);
      toast.success(`Categoria «${node.name}» eliminata.`);
      void reload();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        await confirm({
          title: "Questa categoria non si può eliminare",
          message: (
            <>
              <p>{e.message}</p>
              <p className="mt-2">
                Sposta prima i prodotti e le sottocategorie in un&apos;altra categoria, poi riprova.
              </p>
            </>
          ),
          confirmLabel: "Ho capito",
        });
      } else {
        toast.error(errorMessage(e, "Non è stato possibile eliminare la categoria."));
      }
    } finally {
      setBusy(null);
    }
  };

  const renderLevel = (nodes: CategoryNode[], depth: number): React.ReactNode =>
    nodes.map((node, i) => (
      <li key={node.id}>
        <CategoryRow
          node={node}
          depth={depth}
          expanded={expanded.has(node.id)}
          isFirst={i === 0}
          isLast={i === nodes.length - 1}
          busy={busy === node.id}
          onToggle={() => toggle(node.id)}
          onMove={(dir) => void move(node, nodes, dir)}
          onEdit={() => setDraft({ mode: "edit", category: node })}
          onAddChild={() => setDraft({ mode: "create", parentId: node.id })}
          onDiscount={() => setDiscount({ kind: "category", categoryId: node.id })}
          onDelete={() => void remove(node)}
        />
        {node.children.length > 0 && expanded.has(node.id) && <ul>{renderLevel(node.children, depth + 1)}</ul>}
      </li>
    ));

  return (
    <div>
      <PageTitle
        title="Categorie"
        description="Organizza il catalogo. Le categorie principali compaiono nel menu del negozio in quest'ordine."
        actions={
          <>
            {withChildren.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setExpanded(allOpen ? new Set() : new Set(withChildren))}
              >
                {allOpen ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
                {allOpen ? "Chiudi tutte" : "Apri tutte"}
              </Button>
            )}
            <Button onClick={() => setDraft({ mode: "create", parentId: null })}>
              <Plus className="h-4 w-4" /> Nuova categoria
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="card space-y-1 p-3" aria-busy="true" aria-label="Caricamento categorie">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 p-3" style={{ paddingLeft: i % 3 ? 48 : 12 }}>
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      ) : error && !categories.length ? (
        <div className="card p-8 text-center">
          <p className="font-semibold">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => void reload()}>
            Riprova
          </Button>
        </div>
      ) : !tree.length ? (
        <div className="card">
          <EmptyState
            icon={<FolderTree className="h-7 w-7" />}
            title="Nessuna categoria"
            text="Le categorie aiutano i clienti a trovare i prodotti (es. Scuola, Ufficio, Giochi)."
            action={
              <Button onClick={() => setDraft({ mode: "create", parentId: null })}>
                <Plus className="h-4 w-4" /> Crea la prima categoria
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <ul className="divide-y divide-paper-line">{renderLevel(tree, 0)}</ul>
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            {pluralize(categories.length, "categoria", "categorie")} in tutto. Il numero accanto al nome indica i prodotti
            collegati direttamente.
          </p>
        </>
      )}

      <CategoryModal draft={draft} categories={flat} onClose={() => setDraft(null)} onSaved={() => void reload()} />
      <BulkDiscountModal
        target={discount}
        categories={flat}
        onClose={() => setDiscount(null)}
        onDone={() => void reload()}
      />
      {confirmDialog}
    </div>
  );
}
