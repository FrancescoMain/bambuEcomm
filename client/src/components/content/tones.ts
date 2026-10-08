// I quattro colori delle icone del logo (libro arancio, matita magenta,
// forbici verdi, regalo blu) più il verde Bambù: classi complete per Tailwind.
export type Tone = "orange" | "magenta" | "leaf" | "sky" | "brand";

export const TONE: Record<Tone, { soft: string; icon: string; ink: string; bar: string }> = {
  orange: { soft: "bg-orange-soft", icon: "text-orange", ink: "text-orange-ink", bar: "bg-orange" },
  magenta: { soft: "bg-magenta-soft", icon: "text-magenta", ink: "text-magenta-ink", bar: "bg-magenta" },
  leaf: { soft: "bg-leaf-soft", icon: "text-leaf", ink: "text-leaf-ink", bar: "bg-leaf" },
  sky: { soft: "bg-sky-soft", icon: "text-sky", ink: "text-sky-ink", bar: "bg-sky" },
  brand: { soft: "bg-brand-50", icon: "text-brand-600", ink: "text-brand-700", bar: "bg-brand-400" },
};

/** "393492719021" -> "+39 349 271 9021" */
export const formatWhatsapp = (number: string) => {
  const n = number.replace(/\D/g, "");
  if (n.startsWith("39") && n.length === 12) return `+39 ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
  return n ? `+${n}` : "";
};

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
