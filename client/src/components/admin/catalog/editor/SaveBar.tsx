"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Barra fissa in basso con Salva / Annulla e stato delle modifiche */
export function SaveBar({
  dirty,
  isNew,
  saving,
  onSave,
  onCancel,
}: {
  dirty: boolean;
  isNew: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-paper-line bg-white/95 backdrop-blur lg:left-64 print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <p className="min-w-0 text-sm" aria-live="polite">
          {dirty ? (
            <span className="inline-flex items-center gap-2 font-semibold text-orange-ink">
              <span className="h-2 w-2 shrink-0 rounded-full bg-orange" aria-hidden />
              <span className="sm:hidden">Da salvare</span>
              <span className="hidden sm:inline">Modifiche non salvate</span>
            </span>
          ) : isNew ? (
            <span className="text-ink-muted">
              <span className="hidden sm:inline">Nuovo prodotto non ancora salvato</span>
              <span className="sm:hidden">Non salvato</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <Check className="h-4 w-4 text-brand-600" aria-hidden /> Tutto salvato
            </span>
          )}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Annulla
          </Button>
          <Button onClick={onSave} loading={saving} title="Salva (Ctrl+S)">
            <span className="sm:hidden">Salva</span>
            <span className="hidden sm:inline">Salva prodotto</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
