"use client";

import Link from "next/link";
import { useId } from "react";
import { CalendarClock, Mail, Package } from "lucide-react";
import type { OrderStatus } from "@/lib/types";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { buttonClass } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { addDays, daysFromToday } from "../dates";
import { StatusBadge } from "../orders/OrderBadges";

export type WithdrawalState = "ricevuta" | "accettata" | "rifiutata" | "rimborsata";

export interface WithdrawalRequest {
  id: number;
  orderId: number;
  email: string;
  nome: string;
  articoli: { orderItemId: number; titolo: string; quantity: number }[];
  motivo: string | null;
  note: string | null;
  stato: WithdrawalState;
  createdAt: string;
  updatedAt: string;
  order: { id: number; totalAmount: string | number; status: OrderStatus } | null;
}

export const WITHDRAWAL_STATES: { value: WithdrawalState; label: string; tone: string }[] = [
  { value: "ricevuta", label: "Ricevuta · da valutare", tone: "bg-orange-soft text-orange-ink" },
  { value: "accettata", label: "Accettata · attendo il reso", tone: "bg-sky-soft text-sky-ink" },
  { value: "rimborsata", label: "Rimborsata", tone: "bg-brand-50 text-brand-700" },
  { value: "rifiutata", label: "Rifiutata", tone: "bg-magenta-soft text-magenta-ink" },
];

export const isOpenWithdrawal = (r: WithdrawalRequest) => r.stato === "ricevuta" || r.stato === "accettata";

/** Il rimborso va effettuato entro 14 giorni dalla comunicazione di recesso */
function RefundDeadline({ request }: { request: WithdrawalRequest }) {
  if (!isOpenWithdrawal(request)) return null;
  const deadline = addDays(request.createdAt, 14);
  const left = daysFromToday(deadline);
  const tone = left < 0 ? "bg-magenta-soft text-magenta-ink" : left <= 3 ? "bg-orange-soft text-orange-ink" : "bg-paper-warm text-ink-soft";
  return (
    <p className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold", tone)}>
      <CalendarClock className="h-3.5 w-3.5" />
      Rimborso entro il {formatDate(deadline, { year: undefined })}
      {left < 0 ? ` · scaduto da ${-left} ${left === -1 ? "giorno" : "giorni"}` : left === 0 ? " · oggi" : ` · tra ${left} ${left === 1 ? "giorno" : "giorni"}`}
    </p>
  );
}

export function WithdrawalCard({
  request,
  saving,
  onChangeState,
}: {
  request: WithdrawalRequest;
  saving: boolean;
  onChangeState: (stato: WithdrawalState) => void;
}) {
  const selectId = useId();
  const state = WITHDRAWAL_STATES.find((s) => s.value === request.stato) ?? WITHDRAWAL_STATES[0];
  const pieces = request.articoli.reduce((n, a) => n + a.quantity, 0);
  const subject = `Recesso ordine #${request.orderId} - Cartoleria Bambù`;

  return (
    <article className="card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Richiesta #{request.id} · {formatDateTime(request.createdAt)}
          </p>
          <h3 className="mt-1 text-lg font-extrabold">{request.nome}</h3>
          <a href={`mailto:${request.email}`} className="break-all text-sm font-semibold text-brand-700 hover:underline">
            {request.email}
          </a>
        </div>
        <div className="sm:w-60">
          <label htmlFor={selectId} className="field-label flex items-center justify-between">
            Stato della richiesta {saving && <Spinner className="h-4 w-4 text-brand-600" />}
          </label>
          <select
            id={selectId}
            value={request.stato}
            disabled={saving}
            onChange={(e) => onChangeState(e.target.value as WithdrawalState)}
            className={cn("field font-semibold", state.tone)}
          >
            {WITHDRAWAL_STATES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <div className="rounded-2xl bg-paper-warm/70 p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Ordine</p>
          <Link href={`/dashboard/ordini?id=${request.orderId}`} className="text-lg font-extrabold text-brand-700 hover:underline">
            #{request.orderId}
          </Link>
          {request.order && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{formatPrice(request.order.totalAmount)}</span>
              <StatusBadge order={{ status: request.order.status, metodoConsegna: null }} />
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Articoli da restituire ({pieces} {pieces === 1 ? "pezzo" : "pezzi"})
          </p>
          <ul className="mt-1.5 space-y-1">
            {request.articoli.map((a) => (
              <li key={`${a.orderItemId}-${a.titolo}`} className="flex items-start gap-2 text-[15px]">
                <Package className="mt-1 h-4 w-4 shrink-0 text-ink-faint" />
                <span>
                  <strong>{a.quantity} ×</strong> {a.titolo}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(request.motivo || request.note) && (
        <div className="mt-4 space-y-2 text-[15px]">
          {request.motivo && (
            <p>
              <span className="font-semibold text-ink-muted">Motivo: </span>
              {request.motivo}
            </p>
          )}
          {request.note && (
            <p className="whitespace-pre-line break-words rounded-xl border-l-4 border-paper-line bg-paper px-3 py-2 text-ink-soft">
              {request.note}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-paper-line pt-4">
        <RefundDeadline request={request} />
        <a
          href={`mailto:${request.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Ciao ${request.nome.split(" ")[0]},\n\n`)}`}
          className={buttonClass("outline", "sm", "ml-auto")}
        >
          <Mail className="h-4 w-4" /> Scrivi al cliente
        </a>
      </div>
    </article>
  );
}
