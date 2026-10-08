"use client";

import { useEffect, useId, useState } from "react";
import { CheckCircle2, ExternalLink, PackageCheck, Store, Truck, Zap } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { deliveryOf, nextActions } from "./orderUtils";

export const trackingUrl = (code: string) =>
  `https://gls-group.eu/IT/it/ricerca-spedizione?match=${encodeURIComponent(code)}`;

/**
 * "Prossimo passo": i pulsanti per far avanzare l'ordine e, per le
 * spedizioni, il numero di tracking (inviato al cliente con l'email).
 */
export function OrderNextStep({
  order,
  busy,
  onStatus,
  onSaveTracking,
}: {
  order: Order;
  busy: string | null;
  onStatus: (status: OrderStatus, tracking?: string) => void;
  onSaveTracking: (tracking: string) => void;
}) {
  const id = useId();
  const method = deliveryOf(order);
  const actions = nextActions(order);
  const saved = order.trackingNumber ?? "";
  const [tracking, setTracking] = useState(saved);
  useEffect(() => setTracking(order.trackingNumber ?? ""), [order.id, order.trackingNumber]);

  const showTracking = method === "spedizione" && ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status);
  const trackingDirty = tracking.trim() !== saved;
  const beforeShipping = order.status === "PENDING" || order.status === "PROCESSING";

  if (!actions.length && !showTracking) return null;

  const done = order.status === "DELIVERED";
  const MethodIcon = method === "ritiro" ? Store : method === "giornata" ? Zap : Truck;

  return (
    <section
      aria-label="Prossimo passo"
      className={cn(
        "rounded-2xl border p-4 sm:p-5",
        done ? "border-paper-line bg-white" : "border-brand-200 bg-brand-50/60"
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            done ? "bg-brand-50 text-brand-700" : "bg-brand-600 text-white"
          )}
        >
          {done ? <CheckCircle2 className="h-5 w-5" /> : <MethodIcon className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-[15px] font-bold">{done ? "Ordine completato" : "Prossimo passo"}</p>
          <p className="text-xs text-ink-muted">
            {method === "ritiro"
              ? "Il cliente ritira in negozio"
              : method === "giornata"
                ? "Consegna in giornata"
                : "Spedizione con corriere"}
          </p>
        </div>
      </div>

      {showTracking && (
        <div className="mt-4">
          <label htmlFor={id} className="field-label">
            Numero di tracking {beforeShipping && <span className="font-normal text-ink-muted">(consigliato)</span>}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id={id}
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Es. 1Z999AA10123456784"
              autoComplete="off"
              spellCheck={false}
              className="field font-mono sm:flex-1"
            />
            {!beforeShipping && (
              <Button
                variant="outline"
                onClick={() => onSaveTracking(tracking.trim())}
                disabled={!trackingDirty || !tracking.trim()}
                loading={busy === "tracking"}
              >
                Salva tracking
              </Button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">
            {beforeShipping
              ? "Viene inviato al cliente insieme all'email di spedizione."
              : "Salvando un nuovo numero, il cliente riceve un'email con il tracking aggiornato."}
            {saved && (
              <>
                {" "}
                <a
                  href={trackingUrl(saved)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-semibold text-brand-700 hover:underline"
                >
                  Traccia su GLS <ExternalLink className="h-3 w-3" />
                </a>
              </>
            )}
          </p>
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.status + action.label}
                variant={action.primary ? "primary" : "outline"}
                loading={busy === `status:${action.status}`}
                disabled={!!busy && busy !== `status:${action.status}`}
                onClick={() =>
                  onStatus(
                    action.status,
                    action.status === "SHIPPED" && showTracking && trackingDirty && tracking.trim() ? tracking.trim() : undefined
                  )
                }
              >
                {action.primary && action.status === "SHIPPED" && <PackageCheck className="h-4 w-4" />}
                {action.label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-ink-muted">{actions[0].hint}</p>
        </div>
      )}
    </section>
  );
}
