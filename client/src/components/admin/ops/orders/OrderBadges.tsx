import { Banknote, CreditCard, MessageSquareText, Store, Truck, Zap } from "lucide-react";
import type { Order, ShippingMethod } from "@/lib/types";
import { ORDER_STATUS_TONE } from "@/lib/format";
import { cn } from "@/lib/cn";
import { DELIVERY_LABEL, deliveryOf, isCashOnDelivery, statusLabel } from "./orderUtils";

const pill = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold";

export function StatusBadge({ order, className }: { order: Pick<Order, "status" | "metodoConsegna">; className?: string }) {
  return (
    <span className={cn(pill, "font-bold", ORDER_STATUS_TONE[order.status] ?? "bg-paper-warm text-ink-soft", className)}>
      {statusLabel(order)}
    </span>
  );
}

const DELIVERY_STYLE: Record<ShippingMethod, { icon: React.ReactNode; tone: string }> = {
  spedizione: { icon: <Truck className="h-3.5 w-3.5" />, tone: "bg-paper-warm text-ink-soft" },
  ritiro: { icon: <Store className="h-3.5 w-3.5" />, tone: "bg-leaf-soft text-leaf-ink" },
  giornata: { icon: <Zap className="h-3.5 w-3.5" />, tone: "bg-orange-soft text-orange-ink" },
};

export function DeliveryBadge({ order }: { order: Pick<Order, "metodoConsegna"> }) {
  const method = deliveryOf(order);
  const style = DELIVERY_STYLE[method];
  return (
    <span className={cn(pill, style.tone)}>
      {style.icon}
      {DELIVERY_LABEL[method]}
    </span>
  );
}

export function PaymentBadge({ order }: { order: Pick<Order, "metodoPagamento"> }) {
  const cod = isCashOnDelivery(order);
  return (
    <span className={cn(pill, cod ? "bg-magenta-soft text-magenta-ink" : "bg-sky-soft text-sky-ink")}>
      {cod ? <Banknote className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
      {cod ? "Contrassegno" : "Online"}
    </span>
  );
}

export function NoteBadge() {
  return (
    <span className={cn(pill, "bg-orange-soft text-orange-ink")} title="Il cliente ha lasciato una nota">
      <MessageSquareText className="h-3.5 w-3.5" />
      Nota
    </span>
  );
}
