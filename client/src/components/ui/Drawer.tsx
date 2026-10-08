"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

// Pila degli overlay aperti: Esc e Tab agiscono solo su quello in cima
// (es. una conferma aperta sopra il dettaglio ordine chiude solo la conferma)
const overlayStack: symbol[] = [];
let bodyLocks = 0;
let savedOverflow = "";

/** Pannello laterale/centrale accessibile: Esc chiude, focus intrappolato, scroll bloccato */
function useOverlay(open: boolean, onClose: () => void, panel: React.RefObject<HTMLDivElement | null>) {
  // onClose in un ref: il genitore può passare una funzione nuova a ogni render
  // senza far ripartire l'effetto (che sposterebbe di nuovo il focus)
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const id = Symbol("overlay");
    overlayStack.push(id);
    const isTop = () => overlayStack[overlayStack.length - 1] === id;
    const previous = document.activeElement as HTMLElement | null;
    if (bodyLocks++ === 0) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    const onKey = (e: KeyboardEvent) => {
      if (!isTop()) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === "Tab" && panel.current) {
        const focusables = panel.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    // Se un campo del pannello ha già il focus (autoFocus) lo lasciamo, altrimenti focus sul pannello
    requestAnimationFrame(() => {
      const el = panel.current;
      if (!el || el.contains(document.activeElement)) return;
      (el.querySelector<HTMLElement>("[autofocus], [data-autofocus]") || el).focus();
    });
    return () => {
      const index = overlayStack.indexOf(id);
      if (index >= 0) overlayStack.splice(index, 1);
      if (--bodyLocks === 0) document.body.style.overflow = savedOverflow;
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, panel]);
}

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  side?: "right" | "left";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, panel);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panel}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 flex w-full max-w-md flex-col bg-white shadow-lift outline-none",
          side === "right" ? "right-0 animate-slide-in-right" : "left-0 animate-slide-in-left",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-paper-line px-5 py-4">
          <div className="text-lg font-bold">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-full p-2 text-ink-muted transition hover:bg-paper-warm hover:text-ink"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-paper-line p-5">{footer}</div>}
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, panel);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panel}
        tabIndex={-1}
        className={cn(
          "relative max-h-[92vh] w-full max-w-lg animate-pop-in overflow-y-auto rounded-t-3xl bg-white p-6 shadow-lift outline-none sm:rounded-3xl",
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-ink-muted transition hover:bg-paper-warm hover:text-ink"
          aria-label="Chiudi"
        >
          <X className="h-5 w-5" />
        </button>
        {title && <h2 className="mb-4 pr-10 text-xl font-bold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
