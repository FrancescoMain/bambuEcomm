"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice } from "@/lib/format";

export type SalesRow = { month: string; fatturato: number; ordini: number };
export type SalesMeasure = "fatturato" | "ordini";

// Colori dei token Tailwind (brand-500 per i mesi passati, brand-700 per il mese in corso)
const PAST = "#3f9142";
const CURRENT = "#214f26";
const GRID = "#e9e6de";
const TICK = "#6b6b72";

const euroCompact = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload?: SalesRow }[] }) {
  const row = active ? payload?.[0]?.payload : undefined;
  if (!row) return null;
  return (
    <div className="rounded-xl border border-paper-line bg-white px-3 py-2 text-sm shadow-lift">
      <p className="font-bold text-ink">{row.month}</p>
      <p className="text-ink-soft">
        Fatturato <strong className="text-ink">{formatPrice(row.fatturato)}</strong>
      </p>
      <p className="text-ink-soft">
        Ordini <strong className="text-ink">{row.ordini}</strong>
      </p>
    </div>
  );
}

/** Istogramma degli ultimi 12 mesi: una sola misura alla volta, il mese in corso più scuro */
export default function SalesChart({ data, measure }: { data: SalesRow[]; measure: SalesMeasure }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="25%">
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fill: TICK, fontSize: 12 }}
          interval="preserveStartEnd"
          minTickGap={6}
        />
        <YAxis
          width={measure === "fatturato" ? 64 : 36}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tick={{ fill: TICK, fontSize: 12 }}
          tickFormatter={(v: number) => (measure === "fatturato" ? `${euroCompact.format(v)} €` : String(v))}
        />
        <Tooltip cursor={{ fill: "rgba(29,29,31,0.05)" }} content={<ChartTooltip />} />
        <Bar dataKey={measure} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
          {data.map((row, i) => (
            <Cell key={row.month + i} fill={i === data.length - 1 ? CURRENT : PAST} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
