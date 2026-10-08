import { cn } from "@/lib/cn";

/** Fascia scura di invito all'azione (con i pallini colorati del logo) */
export function CtaBand({
  title,
  text,
  children,
  className,
}: {
  title: string;
  text?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden rounded-3xl bg-ink px-6 py-10 text-white sm:px-12 sm:py-14", className)}>
      <span className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-orange/80" aria-hidden />
      <span className="absolute right-24 top-10 hidden h-5 w-5 rounded-full bg-magenta sm:block" aria-hidden />
      <span className="absolute -bottom-10 right-16 h-24 w-24 rounded-full bg-sky/70" aria-hidden />
      <span className="absolute bottom-8 right-48 hidden h-8 w-8 rounded-full bg-leaf md:block" aria-hidden />
      <div className="relative max-w-2xl">
        <h2 className="text-balance text-3xl font-extrabold text-white sm:text-4xl">{title}</h2>
        {text && <p className="mt-3 text-[17px] leading-relaxed text-white/75">{text}</p>}
        {children && <div className="mt-7 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}

/** Pulsante chiaro da usare dentro CtaBand */
export const ctaLightClass =
  "inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-bold text-ink transition hover:bg-brand-50";
export const ctaGhostClass =
  "inline-flex h-12 items-center gap-2 rounded-full border border-white/25 px-6 text-[15px] font-semibold text-white transition hover:bg-white/10";
