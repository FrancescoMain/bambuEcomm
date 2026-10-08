"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, BadgePercent, ChevronRight, ExternalLink, Folder, FolderPlus, Pencil, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import type { CategoryNode } from "@/lib/types";
import { categoryPath } from "@/lib/urls";
import { isValidImageSrc, pluralize } from "../utils";

const iconBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-paper-warm hover:text-ink disabled:pointer-events-none disabled:opacity-30";

/** Riga dell'albero categorie con le azioni */
export function CategoryRow({
  node,
  depth,
  expanded,
  isFirst,
  isLast,
  busy,
  onToggle,
  onMove,
  onEdit,
  onAddChild,
  onDiscount,
  onDelete,
}: {
  node: CategoryNode;
  depth: number;
  expanded: boolean;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  onToggle: () => void;
  onMove: (dir: -1 | 1) => void;
  onEdit: () => void;
  onAddChild: () => void;
  onDiscount: () => void;
  onDelete: () => void;
}) {
  const hasChildren = node.children.length > 0;
  return (
    <div
      className={cn(
        "flex flex-col gap-2 px-3 py-3 transition-colors hover:bg-paper/60 sm:flex-row sm:items-center sm:gap-3 sm:px-4",
        depth > 0 && "bg-paper/30"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5" style={{ paddingLeft: depth * 28 }}>
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-paper-warm hover:text-ink"
            aria-expanded={expanded}
            aria-label={expanded ? `Chiudi ${node.name}` : `Apri ${node.name}`}
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} />
          </button>
        ) : (
          <span className="h-8 w-8 shrink-0" aria-hidden />
        )}
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-paper-line bg-white text-ink-faint">
          {isValidImageSrc(node.immagine) ? (
            <Image src={node.immagine} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <Folder className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onEdit}
            className={cn("max-w-full truncate text-left hover:text-brand-700", depth === 0 ? "font-bold" : "font-semibold text-ink-soft")}
          >
            {node.name}
          </button>
          <p className="truncate text-xs text-ink-muted">
            {pluralize(node.productCount, "prodotto", "prodotti")}
            {hasChildren ? ` · ${pluralize(node.children.length, "sottocategoria", "sottocategorie")}` : ""}
            {node.description ? ` · ${node.description}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-0.5 self-end sm:self-auto">
        <button type="button" className={iconBtn} onClick={() => onMove(-1)} disabled={isFirst} aria-label={`Sposta su ${node.name}`} title="Sposta su">
          <ArrowUp className="h-4 w-4" />
        </button>
        <button type="button" className={iconBtn} onClick={() => onMove(1)} disabled={isLast} aria-label={`Sposta giù ${node.name}`} title="Sposta giù">
          <ArrowDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDiscount}
          className="mx-1 inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-magenta/40 bg-white px-3 text-sm font-bold text-magenta-ink transition hover:border-magenta hover:bg-magenta-soft"
          aria-label={`Sconto su tutta la categoria ${node.name}`}
          title="Sconto su tutta la categoria"
        >
          <BadgePercent className="h-4 w-4" /> <span className="hidden md:inline">Sconto</span>
        </button>
        <button type="button" className={iconBtn} onClick={onAddChild} aria-label={`Aggiungi sottocategoria a ${node.name}`} title="Aggiungi sottocategoria">
          <FolderPlus className="h-4 w-4" />
        </button>
        <Link
          href={categoryPath(node)}
          target="_blank"
          className={iconBtn}
          aria-label={`Vedi ${node.name} nel negozio`}
          title="Vedi nel negozio"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
        <button type="button" className={iconBtn} onClick={onEdit} aria-label={`Modifica ${node.name}`} title="Modifica">
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(iconBtn, "hover:bg-magenta-soft hover:text-magenta-ink")}
          onClick={onDelete}
          disabled={busy}
          aria-label={`Elimina ${node.name}`}
          title="Elimina"
        >
          {busy ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
