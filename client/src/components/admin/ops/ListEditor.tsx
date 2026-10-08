"use client";

import { useRef } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * Chiavi stabili per le righe di una lista modificabile: spostando o
 * eliminando un elemento i campi non si "scambiano" il contenuto.
 */
function useStableKeys(length: number) {
  const seq = useRef(0);
  const keys = useRef<number[]>([]);
  if (keys.current.length !== length) {
    keys.current = Array.from({ length }, (_, i) => keys.current[i] ?? ++seq.current);
  }
  return {
    keys: keys.current,
    move: (i: number, j: number) => {
      const next = [...keys.current];
      [next[i], next[j]] = [next[j], next[i]];
      keys.current = next;
    },
    remove: (i: number) => {
      keys.current = keys.current.filter((_, k) => k !== i);
    },
    add: () => {
      keys.current = [...keys.current, ++seq.current];
    },
  };
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-paper-line bg-white transition disabled:pointer-events-none disabled:opacity-35",
        danger ? "text-magenta-ink hover:border-magenta/30 hover:bg-magenta-soft" : "text-ink-soft hover:border-ink-faint hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

/**
 * Editor generico per liste (banner, vetrine, FAQ, orari...):
 * aggiungi, rimuovi e riordina con le frecce.
 */
export function ListEditor<T>({
  items,
  onChange,
  createItem,
  renderItem,
  itemTitle,
  addLabel = "Aggiungi",
  max,
  emptyText,
  itemName = "elemento",
  layout = "card",
}: {
  items: T[];
  onChange: (items: T[]) => void;
  createItem: () => T;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  itemTitle?: (item: T, index: number) => React.ReactNode;
  addLabel?: string;
  max?: number;
  emptyText?: React.ReactNode;
  /** Usato nelle etichette accessibili ("Sposta su banner 2") */
  itemName?: string;
  /** "card": riquadro con intestazione; "row": riga compatta con i pulsanti a destra */
  layout?: "card" | "row";
}) {
  const stable = useStableKeys(items.length);
  const canAdd = max === undefined || items.length < max;

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    stable.move(i, j);
    onChange(next);
  };

  const controls = (i: number) => (
    <>
      <IconButton label={`Sposta su ${itemName} ${i + 1}`} disabled={i === 0} onClick={() => move(i, -1)}>
        <ArrowUp className="h-4 w-4" />
      </IconButton>
      <IconButton label={`Sposta giù ${itemName} ${i + 1}`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>
        <ArrowDown className="h-4 w-4" />
      </IconButton>
      <IconButton
        label={`Rimuovi ${itemName} ${i + 1}`}
        danger
        onClick={() => {
          stable.remove(i);
          onChange(items.filter((_, k) => k !== i));
        }}
      >
        <Trash2 className="h-4 w-4" />
      </IconButton>
    </>
  );
  const updater = (i: number) => (patch: Partial<T>) => onChange(items.map((it, k) => (k === i ? { ...it, ...patch } : it)));

  return (
    <div className={layout === "row" ? "space-y-2" : "space-y-3"}>
      {items.length === 0 && emptyText && (
        <p className="rounded-2xl border border-dashed border-paper-line px-5 py-6 text-center text-sm text-ink-muted">{emptyText}</p>
      )}
      {items.map((item, i) =>
        layout === "row" ? (
          <div key={stable.keys[i]} className="flex flex-col gap-2 rounded-2xl border border-paper-line bg-paper/70 p-2.5 sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0">
            <div className="min-w-0 flex-1">{renderItem(item, updater(i), i)}</div>
            <div className="flex shrink-0 justify-end gap-1.5">{controls(i)}</div>
          </div>
        ) : (
          <div key={stable.keys[i]} className="rounded-2xl border border-paper-line bg-paper/70 p-3.5 sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-ink-muted shadow-sm">
                {i + 1}
              </span>
              <p className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{itemTitle?.(item, i)}</p>
              {controls(i)}
            </div>
            {renderItem(item, updater(i), i)}
          </div>
        )
      )}
      {canAdd ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            stable.add();
            onChange([...items, createItem()]);
          }}
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      ) : (
        <p className="text-xs font-medium text-ink-muted">Hai raggiunto il massimo di {max}.</p>
      )}
    </div>
  );
}

/** Lista di testi semplici (es. messaggi della barra in alto) */
export function StringListEditor({
  items,
  onChange,
  placeholder,
  addLabel = "Aggiungi",
  max,
  itemName = "riga",
  maxLength,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  max?: number;
  itemName?: string;
  maxLength?: number;
}) {
  const stable = useStableKeys(items.length);
  const canAdd = max === undefined || items.length < max;

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    stable.move(i, j);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {items.map((text, i) => (
        <div key={stable.keys[i]} className="flex items-center gap-1.5">
          <span className="w-5 shrink-0 text-center text-xs font-bold text-ink-faint" aria-hidden>
            {i + 1}
          </span>
          <input
            value={text}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-label={`${itemName} ${i + 1}`}
            onChange={(e) => onChange(items.map((t, k) => (k === i ? e.target.value : t)))}
            className="field min-w-0 flex-1"
          />
          <IconButton label={`Sposta su ${itemName} ${i + 1}`} disabled={i === 0} onClick={() => move(i, -1)}>
            <ArrowUp className="h-4 w-4" />
          </IconButton>
          <IconButton label={`Sposta giù ${itemName} ${i + 1}`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>
            <ArrowDown className="h-4 w-4" />
          </IconButton>
          <IconButton
            label={`Rimuovi ${itemName} ${i + 1}`}
            danger
            onClick={() => {
              stable.remove(i);
              onChange(items.filter((_, k) => k !== i));
            }}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      ))}
      {canAdd ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            stable.add();
            onChange([...items, ""]);
          }}
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      ) : (
        <p className="text-xs font-medium text-ink-muted">Hai raggiunto il massimo di {max}.</p>
      )}
    </div>
  );
}
