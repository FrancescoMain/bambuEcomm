import Image from "next/image";
import Link from "next/link";
import { Check, Heart, KeyRound, MailCheck, MessageCircle, Package, RotateCcw, ShoppingBag, Timer } from "lucide-react";

type Variant = "account" | "recover";

const ASIDE: Record<Variant, { title: string; items: { icon: React.ElementType; title: string; text: string }[] }> = {
  account: {
    title: "Con un account Bambù",
    items: [
      { icon: Package, title: "Segui ordini e spedizioni", text: "Stato, tracking e storico sempre a portata di mano." },
      { icon: Heart, title: "Preferiti su ogni dispositivo", text: "Salva i prodotti e ritrovali dal telefono o dal computer." },
      { icon: ShoppingBag, title: "Il carrello ti aspetta", text: "Inizi dal telefono e concludi dal computer, o viceversa." },
      { icon: RotateCcw, title: "Annulli in un clic", text: "Entro 24 ore dall'ordine, se non è ancora partito." },
    ],
  },
  recover: {
    title: "Recuperare l'accesso è semplice",
    items: [
      { icon: MailCheck, title: "Controlla la posta", text: "Ti inviamo un link: se non lo trovi, guarda anche nello spam." },
      { icon: Timer, title: "Il link vale 1 ora", text: "Se è scaduto puoi richiederne uno nuovo in qualsiasi momento." },
      { icon: KeyRound, title: "Scegli una password sicura", text: "Almeno 8 caratteri, meglio se con numeri e simboli." },
      { icon: MessageCircle, title: "Serve aiuto?", text: "Scrivici dalla pagina Contatti: ti aiutiamo noi." },
    ],
  },
};

/** Pagine di accesso: modulo a sinistra, vantaggi a destra (sotto su mobile) */
export function AuthShell({
  title,
  subtitle,
  children,
  aside = "account",
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  aside?: Variant;
}) {
  const content = ASIDE[aside];
  return (
    <div className="container py-8 sm:py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-paper-line bg-white shadow-card lg:grid-cols-[1.15fr_1fr]">
        <div className="p-6 sm:p-10 lg:p-12">
          <h1 className="text-balance text-3xl font-extrabold sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>

        <aside className="relative overflow-hidden bg-brand-700 p-6 text-white sm:p-10 lg:p-12">
          <span className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange/90" aria-hidden />
          <span className="absolute right-28 top-16 hidden h-4 w-4 rounded-full bg-magenta lg:block" aria-hidden />
          <span className="absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-sky/60" aria-hidden />
          <span className="absolute bottom-24 right-10 h-6 w-6 rounded-full bg-leaf" aria-hidden />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">Cartoleria Bambù</p>
            <h2 className="mt-2 text-2xl font-extrabold text-white">{content.title}</h2>
            <ul className="mt-6 space-y-5">
              {content.items.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-bold">{title}</span>
                    <span className="block text-sm text-white/75">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8 hidden items-end justify-between gap-4 lg:flex">
              <p className="flex items-center gap-2 text-sm text-white/80">
                <Check className="h-4 w-4" aria-hidden /> Dal 2016 a Torre Annunziata
              </p>
              <span className="rotate-3 rounded-2xl bg-white p-2.5 shadow-lift">
                <Image src="/logo-panda.png" alt="" width={1034} height={792} sizes="112px" className="h-auto w-28" />
              </span>
            </div>
            {aside === "recover" && (
              <Link
                href="/contatti"
                className="mt-6 inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-ink transition hover:bg-brand-50"
              >
                Contattaci
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
