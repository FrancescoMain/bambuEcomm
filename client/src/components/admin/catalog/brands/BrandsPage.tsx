"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, Package, Tags } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/admin/PageTitle";
import { SingleImageUploader } from "@/components/admin/ImageUploader";
import { Callout } from "@/components/admin/ops/Callout";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Spinner";
import { api, errorMessage, revalidateStorefront } from "@/lib/api/client";
import type { Paginated } from "@/lib/types";
import { brandPath } from "@/lib/urls";
import { pluralize } from "../utils";

type AdminBrand = { name: string; slug: string; count: number; logo: string | null; descrizione: string | null };

/** Scheda di una marca: logo e descrizione mostrati nel negozio */
function BrandCard({ brand, onSaved }: { brand: AdminBrand; onSaved: (b: AdminBrand) => void }) {
  const [logo, setLogo] = useState(brand.logo);
  const [descrizione, setDescrizione] = useState(brand.descrizione ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = logo !== brand.logo || descrizione.trim() !== (brand.descrizione ?? "");

  const save = async () => {
    setSaving(true);
    try {
      const saved = await api<{ logo: string | null; descrizione: string | null }>(`/brands/${brand.slug}`, {
        method: "PUT",
        body: { nome: brand.name, logo, descrizione },
      });
      onSaved({ ...brand, logo: saved.logo, descrizione: saved.descrizione });
      setDescrizione(saved.descrizione ?? "");
      revalidateStorefront(["products"]);
      toast.success(`Scheda di «${brand.name}» salvata.`);
    } catch (e) {
      toast.error(errorMessage(e, "Non è stato possibile salvare la marca."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="card grid gap-4 p-4 sm:grid-cols-[120px_1fr] sm:p-5">
      <div className="w-28 sm:w-full">
        <SingleImageUploader value={logo} onChange={setLogo} folder="brands" />
        <p className="mt-1.5 text-center text-xs text-ink-muted">Logo</p>
      </div>
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <h2 className="text-lg font-extrabold">{brand.name}</h2>
          <Link
            href={`/dashboard/prodotti?q=${encodeURIComponent(brand.name)}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
          >
            <Package className="h-4 w-4" /> {pluralize(brand.count, "prodotto", "prodotti")}
          </Link>
          <a
            href={brandPath(brand.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            <ExternalLink className="h-4 w-4" /> Vedi nel negozio
          </a>
        </div>
        <Textarea
          label="Descrizione"
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={`Due righe su ${brand.name}: cosa produce, perché piace…`}
          hint="Facoltativa: compare in cima alla pagina della marca."
        />
        <div className="flex justify-end">
          <Button onClick={save} disabled={!dirty || saving} size="sm">
            {saving ? "Salvataggio…" : "Salva"}
          </Button>
        </div>
      </div>
    </li>
  );
}

export function BrandsPage() {
  const [brands, setBrands] = useState<AdminBrand[] | null>(null);
  const [withoutBrand, setWithoutBrand] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AdminBrand[]>("/brands")
      .then(setBrands)
      .catch((e) => setError(errorMessage(e, "Non è stato possibile caricare le marche.")));
    api<Paginated<unknown>>("/products", { query: { noBrand: "true", limit: 1 } })
      .then((r) => setWithoutBrand(r.totalProducts))
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <PageTitle
        title="Marche"
        description="Le marche nascono dal campo «Marca» dei prodotti. Qui aggiungi logo e descrizione, che compaiono nella pagina Marche del negozio."
      />

      {withoutBrand > 0 && (
        <Callout tone="warning" title={`${pluralize(withoutBrand, "prodotto è", "prodotti sono")} senza marca`} className="mb-5">
          Non compaiono in nessuna pagina marca.{" "}
          <Link href="/dashboard/prodotti?senza-marca=1">Mostrali nella lista Prodotti</Link>, selezionali e usa
          «Imposta marca».
        </Callout>
      )}

      {error ? (
        <Callout tone="danger">{error}</Callout>
      ) : !brands ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <EmptyState
          icon={<Tags className="h-7 w-7" />}
          title="Nessuna marca"
          text="Scrivi la marca nella scheda dei prodotti (o con «Imposta marca» dalla lista) e comparirà qui."
          className="card"
        />
      ) : (
        <ul className="space-y-3">
          {brands.map((b) => (
            <BrandCard
              key={b.slug}
              brand={b}
              onSaved={(saved) => setBrands((list) => list?.map((x) => (x.slug === saved.slug ? saved : x)) ?? list)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
