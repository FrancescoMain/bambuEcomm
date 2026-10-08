import Link from "next/link";
import { ArrowUpRight, CircleHelp, MessageCircle, Package, RotateCcw, Truck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { TONE, type Tone } from "./tones";

type HelpLink = { href: string; title: string; text: string; icon: LucideIcon; tone: Tone };

const LINKS: HelpLink[] = [
  { href: "/faq", title: "Domande frequenti", text: "Le risposte più veloci", icon: CircleHelp, tone: "sky" },
  { href: "/spedizioni-e-resi", title: "Spedizioni e resi", text: "Costi, tempi e ritiro", icon: Truck, tone: "orange" },
  { href: "/recesso", title: "Recesso online", text: "Restituisci in 3 passaggi", icon: RotateCcw, tone: "magenta" },
  { href: "/account/ordini", title: "I miei ordini", text: "Stato e tracking", icon: Package, tone: "leaf" },
  { href: "/contatti", title: "Contatti", text: "Scrivici o chiamaci", icon: MessageCircle, tone: "brand" },
];

/** Collegamenti rapidi alle pagine di assistenza */
export function HelpLinks({
  exclude = [],
  className,
  compact,
}: {
  exclude?: string[];
  className?: string;
  /** una colonna (per le barre laterali) */
  compact?: boolean;
}) {
  const links = LINKS.filter((l) => !exclude.includes(l.href));
  return (
    <ul className={cn("grid gap-3", !compact && "sm:grid-cols-2 lg:grid-cols-4", className)}>
      {links.map(({ href, title, text, icon: Icon, tone }) => (
        <li key={href}>
          <Link
            href={href}
            className="group flex h-full items-center gap-3 rounded-2xl border border-paper-line bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", TONE[tone].soft)}>
              <Icon className={cn("h-5 w-5", TONE[tone].icon)} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold leading-tight">{title}</span>
              <span className="block truncate text-sm text-ink-muted">{text}</span>
            </span>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 text-ink-faint transition group-hover:text-ink"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
