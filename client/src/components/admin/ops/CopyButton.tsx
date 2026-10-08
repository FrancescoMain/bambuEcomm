"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

/** Copia un testo negli appunti (indirizzo, P.IVA, tracking...) */
export function CopyButton({
  text,
  label = "Copia",
  iconOnly,
  className,
}: {
  text: string;
  label?: string;
  /** Mostra solo l'icona (l'etichetta resta per i lettori di schermo) */
  iconOnly?: boolean;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(id);
  }, [done]);

  return (
    <button
      type="button"
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
        } catch {
          toast.error("Non è stato possibile copiare il testo.");
        }
      }}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-ink-muted transition hover:bg-paper-warm hover:text-ink",
        className
      )}
    >
      {done ? <Check className="h-3.5 w-3.5 text-brand-600" /> : <Copy className="h-3.5 w-3.5" />}
      {!iconOnly && <span aria-live="polite">{done ? "Copiato" : label}</span>}
    </button>
  );
}
