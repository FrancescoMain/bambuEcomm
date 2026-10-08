"use client";

import Link from "next/link";
import { Pencil, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/Spinner";
import type { AdminListProduct } from "../types";

export interface RowHandlers {
  onSelect: (checked: boolean) => void;
  onDiscount: () => void;
  onToggleAvailable: (value: boolean) => void;
  onToggleFeatured: (value: boolean) => void;
  onDelete: () => void;
  busy: { available: boolean; featured: boolean; delete: boolean };
}

export const editHref = (id: number) => `/dashboard/prodotti/${id}`;

/** Stella "in evidenza nella home" */
export function FeaturedToggle({
  product,
  onToggle,
  busy,
}: {
  product: AdminListProduct;
  onToggle: (value: boolean) => void;
  busy?: boolean;
}) {
  const on = product.inEvidenza;
  return (
    <button
      type="button"
      onClick={() => onToggle(!on)}
      disabled={busy}
      aria-pressed={on}
      aria-label={on ? `Togli ${product.titolo} dai prodotti in evidenza` : `Metti ${product.titolo} in evidenza nella home`}
      title={on ? "In evidenza nella home: clicca per togliere" : "Metti in evidenza nella home"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full transition disabled:opacity-60",
        on ? "bg-orange-soft text-orange hover:bg-orange-soft/70" : "text-ink-faint hover:bg-paper-warm hover:text-orange"
      )}
    >
      <Star className={cn("h-[18px] w-[18px]", on && "fill-orange")} />
    </button>
  );
}

/** Marca · codice · varianti sotto il titolo */
export function ProductMeta({ product, className }: { product: AdminListProduct; className?: string }) {
  const bits = [
    product.marca,
    product.codice ? `Cod. ${product.codice}` : null,
    product.hasVariants ? "Con varianti" : null,
  ].filter(Boolean);
  if (!bits.length) return null;
  return <p className={cn("truncate text-xs text-ink-muted", className)}>{bits.join(" · ")}</p>;
}

/** Nomi delle categorie (massimo 2 + "altre N") */
export function CategoryNames({ product, className }: { product: AdminListProduct; className?: string }) {
  const names = product.categoria.map((c) => c.name);
  if (!names.length) return <span className={cn("text-xs text-magenta-ink", className)}>Nessuna categoria</span>;
  const shown = names.slice(0, 2).join(", ");
  return (
    <span className={cn("text-sm text-ink-soft", className)} title={names.join(", ")}>
      {shown}
      {names.length > 2 && <span className="text-ink-muted"> +{names.length - 2}</span>}
    </span>
  );
}

/** Matita (modifica) e cestino (elimina) */
export function RowActions({
  product,
  onDelete,
  busy,
}: {
  product: AdminListProduct;
  onDelete: () => void;
  busy?: boolean;
}) {
  return (
    <>
      <Link
        href={editHref(product.id)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-paper-warm hover:text-ink"
        aria-label={`Modifica ${product.titolo}`}
        title="Modifica"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-magenta-soft hover:text-magenta-ink disabled:opacity-60"
        aria-label={`Elimina ${product.titolo}`}
        title="Elimina"
      >
        {busy ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </>
  );
}

/** Casella di selezione per le azioni di gruppo */
export function SelectBox({
  checked,
  onChange,
  label,
  indeterminate,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  indeterminate?: boolean;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate && !checked;
      }}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={label}
      className="form-checkbox h-[18px] w-[18px] cursor-pointer rounded-md border-ink-faint/60 text-brand-600 focus:ring-brand-500/30"
    />
  );
}
