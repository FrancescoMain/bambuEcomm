import { cn } from "@/lib/cn";

/** "Come funziona" in passaggi numerati */
export function Steps({
  steps,
  className,
  stacked,
}: {
  steps: { title: string; text: React.ReactNode }[];
  className?: string;
  /** una sotto l'altra (numero a sinistra) anche su schermi larghi */
  stacked?: boolean;
}) {
  return (
    <ol className={cn("grid gap-4", !stacked && "md:grid-cols-3 md:gap-5", className)}>
      {steps.map((s, i) => (
        <li
          key={s.title}
          className={cn("rounded-3xl border border-paper-line bg-white", stacked ? "flex items-start gap-4 p-5" : "p-6")}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-extrabold text-white"
            aria-hidden
          >
            {i + 1}
          </span>
          <div>
            <h3 className={cn("font-extrabold", stacked ? "mt-2" : "mt-4")}>
              <span className="sr-only">Passo {i + 1}: </span>
              {s.title}
            </h3>
            <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
