import type { Metadata } from "next";
import Link from "next/link";
import { Tags } from "lucide-react";
import { getBrands } from "@/lib/api/server";
import { brandPath, SITE_URL } from "@/lib/urls";
import { plural } from "@/lib/format";
import { PageHeader } from "@/components/shop/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Marche",
  description: "Tutte le marche di Cartoleria Bambù: scegli il tuo marchio preferito e scopri i prodotti disponibili.",
  alternates: { canonical: `${SITE_URL}/marche` },
};

/** Lettera dell'indice: accenti tolti, cifre e simboli raccolti sotto "#" */
const initial = (name: string) => {
  const c = name.normalize("NFD").charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : "#";
};

type Brand = Awaited<ReturnType<typeof getBrands>>[number];

function BrandGrid({ brands }: { brands: Brand[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {brands.map((b) => (
        <li key={b.slug}>
          <Link
            href={brandPath(b.name)}
            className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-brand-500"
          >
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg font-extrabold text-brand-700"
            >
              {b.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-bold text-ink">{b.name}</span>
              <span className="text-sm text-ink-muted">{plural(b.count, "prodotto", "prodotti")} →</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function BrandsPage() {
  const brands = await getBrands();
  // Con poche marche basta una griglia: le lettere servono solo quando la lista si allunga
  const byLetter = brands.length > 12;
  const groups = new Map<string, Brand[]>();
  for (const b of brands) {
    const key = initial(b.name);
    groups.set(key, [...(groups.get(key) || []), b]);
  }
  const letters = [...groups.keys()].sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)));

  return (
    <>
      <PageHeader title="Marche" subtitle="Scegli il tuo marchio preferito e scopri tutti i suoi prodotti.">
        {byLetter && (
          <nav aria-label="Indice alfabetico" className="mt-6 flex flex-wrap gap-1.5">
            {letters.map((l) => (
              <a
                key={l}
                href={`#lettera-${l === "#" ? "altro" : l}`}
                className="flex h-9 min-w-9 items-center justify-center rounded-full bg-white px-2 text-sm font-bold text-ink-soft shadow-card hover:text-brand-700"
              >
                {l}
              </a>
            ))}
          </nav>
        )}
      </PageHeader>

      <div className="container py-10 sm:py-14">
        {brands.length === 0 ? (
          <EmptyState
            icon={<Tags className="h-7 w-7" />}
            title="Nessuna marca per ora"
            text="Stiamo aggiornando il catalogo: intanto guarda tutti i prodotti."
            action={
              <Link href="/prodotti" className={buttonClass("primary")}>
                Vedi tutti i prodotti
              </Link>
            }
            className="card"
          />
        ) : byLetter ? (
          <div className="space-y-10">
            {letters.map((l) => (
              <section key={l} id={`lettera-${l === "#" ? "altro" : l}`} className="scroll-mt-28" aria-label={`Marche con ${l}`}>
                <h2 className="mb-4 text-2xl font-extrabold text-brand-600">{l}</h2>
                <BrandGrid brands={groups.get(l)!} />
              </section>
            ))}
          </div>
        ) : (
          <BrandGrid brands={brands} />
        )}
      </div>
    </>
  );
}
