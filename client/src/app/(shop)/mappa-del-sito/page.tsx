import type { Metadata } from "next";
import Link from "next/link";
import { CircleHelp, LayoutGrid, Newspaper, ScrollText, ShoppingBag, User, type LucideIcon } from "lucide-react";
import { getCategoryTree, getPosts } from "@/lib/api/server";
import type { CategoryNode } from "@/lib/types";
import { categoryPath } from "@/lib/urls";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shop/PageHeader";
import { TONE, type Tone } from "@/components/content/tones";

export const metadata: Metadata = {
  title: "Mappa del sito",
  description: "Tutte le pagine di Cartoleria Bambù: categorie di prodotti, offerte, novità, assistenza, blog e area personale.",
  alternates: { canonical: "/mappa-del-sito" },
};

type PageLink = { href: string; label: string };

const SHOP: PageLink[] = [
  { href: "/prodotti", label: "Tutti i prodotti" },
  { href: "/offerte", label: "Offerte" },
  { href: "/novita", label: "Novità" },
  { href: "/preferiti", label: "Preferiti" },
  { href: "/carrello", label: "Carrello" },
];

const INFO: PageLink[] = [
  { href: "/chi-siamo", label: "Chi siamo" },
  { href: "/contatti", label: "Contatti e negozio" },
  { href: "/faq", label: "Domande frequenti" },
  { href: "/spedizioni-e-resi", label: "Spedizioni e resi" },
  { href: "/recesso", label: "Recesso online" },
  { href: "/preventivi", label: "Ordini per scuole, uffici e associazioni" },
  { href: "/rivenditori", label: "Diventa rivenditore" },
];

const ACCOUNT: PageLink[] = [
  { href: "/login", label: "Accedi" },
  { href: "/register", label: "Crea un account" },
  { href: "/account", label: "Il mio account" },
  { href: "/account/ordini", label: "I miei ordini" },
  { href: "/forgot-password", label: "Password dimenticata" },
];

const LEGAL: PageLink[] = [
  { href: "/terms", label: "Termini e condizioni" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/cookies", label: "Cookie policy" },
  { href: "/newsletter/disiscrizione", label: "Disiscrizione dalla newsletter" },
];

const link = "text-[15px] text-ink-soft transition hover:text-brand-700 hover:underline";

function Block({
  title,
  icon: Icon,
  tone,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const id = `mappa-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section className={cn("rounded-3xl border border-paper-line bg-white p-6 sm:p-7", className)} aria-labelledby={id}>
      <h2 id={id} className="flex items-center gap-3 text-lg font-extrabold">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", TONE[tone].soft)}>
          <Icon className={cn("h-5 w-5", TONE[tone].icon)} aria-hidden />
        </span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Links({ items }: { items: PageLink[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className={link}>
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CategoryList({ nodes, depth = 0 }: { nodes: CategoryNode[]; depth?: number }) {
  return (
    <ul className={cn(depth === 0 ? "grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3" : "mt-2 space-y-2 border-l border-paper-line pl-4")}>
      {nodes.map((c) => (
        <li key={c.id}>
          <Link
            href={categoryPath(c)}
            className={cn(depth === 0 ? "font-extrabold text-ink hover:text-brand-700 hover:underline" : link)}
          >
            {c.name}
          </Link>
          {c.children.length > 0 && <CategoryList nodes={c.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

export default async function SitemapPage() {
  const [tree, posts] = await Promise.all([getCategoryTree(), getPosts(50)]);

  return (
    <>
      <PageHeader title="Mappa del sito" subtitle="Tutte le pagine di Cartoleria Bambù, in un colpo d'occhio." />
      <div className="container grid gap-5 py-10 sm:py-14 md:grid-cols-2 lg:grid-cols-3">
        <Block title="Categorie" icon={LayoutGrid} tone="orange" className="md:col-span-2 lg:col-span-3">
          {tree.length ? (
            <CategoryList nodes={tree} />
          ) : (
            <p className="text-[15px] text-ink-muted">
              Le categorie non sono disponibili in questo momento:{" "}
              <Link href="/prodotti" className="font-semibold text-brand-700 underline">
                vedi tutti i prodotti
              </Link>
              .
            </p>
          )}
        </Block>
        <Block title="Negozio online" icon={ShoppingBag} tone="magenta">
          <Links items={SHOP} />
        </Block>
        <Block title="Informazioni e assistenza" icon={CircleHelp} tone="sky">
          <Links items={INFO} />
        </Block>
        <Block title="Area personale" icon={User} tone="leaf">
          <Links items={ACCOUNT} />
        </Block>
        <Block title="Blog" icon={Newspaper} tone="brand" className={posts.length > 4 ? "md:col-span-2" : undefined}>
          <Links items={[{ href: "/blog", label: "Tutti gli articoli" }, ...posts.map((p) => ({ href: `/blog/${p.slug}`, label: p.titolo }))]} />
        </Block>
        <Block title="Note legali" icon={ScrollText} tone="orange">
          <Links items={LEGAL} />
        </Block>
      </div>
    </>
  );
}
