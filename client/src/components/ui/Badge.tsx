import { cn } from "@/lib/cn";

type Tone = "sale" | "new" | "soldout" | "neutral" | "brand" | "orange" | "sky";

const tones: Record<Tone, string> = {
  sale: "bg-magenta text-white",
  new: "bg-sky text-white",
  soldout: "bg-ink/80 text-white",
  neutral: "bg-paper-warm text-ink-soft",
  brand: "bg-brand-50 text-brand-700",
  orange: "bg-orange-soft text-orange-ink",
  sky: "bg-sky-soft text-sky-ink",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase leading-none tracking-wide",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
