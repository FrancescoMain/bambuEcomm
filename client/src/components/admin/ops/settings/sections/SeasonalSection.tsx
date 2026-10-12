"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Ghost, Plus } from "lucide-react";
import type { Category } from "@/lib/types";
import { api, errorMessage, revalidateStorefront } from "@/lib/api/client";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { HalloweenHero } from "@/components/shop/halloween/HalloweenHero";
import { activeSeasonalTheme, romeToday } from "@/lib/seasonal";
import { formatDate } from "@/lib/format";
import { categoryPath } from "@/lib/urls";
import { cn } from "@/lib/cn";
import { DateRangeFields } from "../../../catalog/DateRangeFields";
import { indentLabel, useCategories } from "../../../catalog/categories";
import { Callout } from "../../Callout";
import { Toggle } from "../../Toggle";
import { Block, Preview, SaveBar } from "../SettingsUi";
import { useSettingsForm } from "../useSettingsForm";

/** Periodo suggerito: da metà ottobre al giorno dei morti */
const suggestedPeriod = () => {
  const year = romeToday().slice(0, 4);
  return { inizio: `${year}-10-15`, fine: `${year}-11-02` };
};

export function SeasonalSection() {
  const form = useSettingsForm({
    section: "halloween",
    keys: ["temaStagionale"] as const,
    validate: ({ temaStagionale: t }) => {
      const errors: string[] = [];
      if (t.attivo && !t.titolo.trim()) errors.push("Scrivi il titolo del banner di Halloween.");
      if (t.inizio && t.fine && t.fine < t.inizio) errors.push("La data di fine viene prima di quella di inizio.");
      return errors;
    },
  });
  const t = form.draft.temaStagionale;
  const set = (patch: Partial<typeof t>) => form.update("temaStagionale", (prev) => ({ ...prev, ...patch }));

  const { categories, flat, loading, reload } = useCategories();
  const [creating, setCreating] = useState(false);
  const halloweenExisting = categories.find((c) => c.name.trim().toLowerCase() === "halloween");
  const selected = categories.find((c) => c.id === t.categoriaId);

  const createCategory = async () => {
    setCreating(true);
    try {
      const res = await api<{ category: Category }>("/categories", {
        method: "POST",
        body: { name: "Halloween", description: "Costumi, trucchi, decorazioni e idee per la notte di Halloween." },
      });
      await reload();
      set({ categoriaId: res.category.id });
      revalidateStorefront(["categories"]);
      toast.success("Categoria Halloween creata", { description: "Ricordati di salvare il tema." });
    } catch (e) {
      toast.error(errorMessage(e, "Non è stato possibile creare la categoria."));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5">
      <Block
        icon={<Ghost className="h-5 w-5" />}
        title="Tema Halloween"
        description="Nel periodo scelto il sito si veste per Halloween: banner notturno in home, colori a tema, zucche e pipistrelli, e la categoria Halloween in evidenza nel menu. Finito il periodo torna tutto normale da solo."
      >
        <Toggle checked={t.attivo} onChange={(attivo) => set({ attivo })} label="Attiva il tema Halloween" />
        <ThemeStatus attivo={t.attivo} inizio={t.inizio} fine={t.fine} dirty={form.dirty} />

        <div className={cn("space-y-5 transition-opacity", !t.attivo && "opacity-60")}>
          <div>
            <DateRangeFields
              start={t.inizio ?? ""}
              end={t.fine ?? ""}
              startLabel="Dal"
              endLabel="Al (compreso)"
              onChange={({ start, end }) => set({ inizio: start || null, fine: end || null })}
              hint="Lascia vuote le date per tenere il tema acceso finché non spegni l'interruttore."
            />
            <button
              type="button"
              onClick={() => set(suggestedPeriod())}
              className="mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Usa il periodo consigliato (15 ottobre – 2 novembre)
            </button>
          </div>

          <div>
            <Select
              label="Categoria da mettere in evidenza"
              value={t.categoriaId ?? ""}
              disabled={loading}
              onChange={(e) => set({ categoriaId: e.target.value ? Number(e.target.value) : null })}
              hint="Compare per prima nel menu, con la zucca, e i suoi prodotti vanno in home sotto il banner."
            >
              <option value="">Nessuna</option>
              {flat.map((c) => (
                <option key={c.id} value={c.id}>
                  {indentLabel(c)}
                </option>
              ))}
            </Select>
            {!loading && !halloweenExisting && (
              <Button variant="outline" size="sm" className="mt-2" onClick={createCategory} disabled={creating}>
                <Plus className="h-4 w-4" />
                {creating ? "Creazione…" : "Crea la categoria Halloween"}
              </Button>
            )}
            {!loading && halloweenExisting && !t.categoriaId && (
              <button
                type="button"
                onClick={() => set({ categoriaId: halloweenExisting.id })}
                className="mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Usa la categoria “{halloweenExisting.name}”
              </button>
            )}
          </div>

          {selected && (
            <Callout tone="neutral" title={`Come aggiungere prodotti a “${selected.name}”`}>
              Apri un prodotto e spunta la categoria <strong>{selected.name}</strong> (un prodotto può stare in più
              categorie), oppure in{" "}
              <Link href="/dashboard/prodotti" className="font-semibold underline">
                Prodotti
              </Link>{" "}
              seleziona più articoli e usa <strong>Aggiungi a categoria</strong>. Ora ci sono{" "}
              <strong>{selected.productCount}</strong> prodotti.
            </Callout>
          )}

          <Input label="Titolo del banner" value={t.titolo} maxLength={80} onChange={(e) => set({ titolo: e.target.value })} />
          <Textarea
            label="Sottotitolo"
            rows={2}
            className="[&_textarea]:min-h-[64px]"
            value={t.sottotitolo}
            maxLength={200}
            onChange={(e) => set({ sottotitolo: e.target.value })}
          />
        </div>

        <Preview>
          <div className="pointer-events-none">
            <HalloweenHero
              titolo={t.titolo || "Halloween da Bambù"}
              sottotitolo={t.sottotitolo}
              href={selected ? categoryPath(selected) : null}
            />
          </div>
        </Preview>
      </Block>
      <SaveBar form={form} label="Salva tema" />
    </div>
  );
}

/** Spiega in una riga se i clienti vedono il tema adesso (con le impostazioni della bozza) */
function ThemeStatus({
  attivo,
  inizio,
  fine,
  dirty,
}: {
  attivo: boolean;
  inizio: string | null;
  fine: string | null;
  dirty: boolean;
}) {
  if (!attivo) return null;
  const today = romeToday();
  const visible = !!activeSeasonalTheme({ attivo, tema: "halloween", inizio, fine, categoriaId: null, titolo: "", sottotitolo: "" });
  const day = (d: string) => formatDate(`${d}T12:00:00`);
  const suffix = dirty ? " (dopo il salvataggio)" : "";
  if (visible) {
    return (
      <Callout tone="success" title={`Il tema è visibile sul sito${suffix}`}>
        {fine ? `Resterà attivo fino al ${day(fine)} compreso.` : "Resterà attivo finché non spegni l'interruttore."}
      </Callout>
    );
  }
  if (inizio && today < inizio) {
    return (
      <Callout tone="info" title={`Il tema partirà da solo il ${day(inizio)}${suffix}`}>
        Fino ad allora il sito resta con la grafica normale.
      </Callout>
    );
  }
  return (
    <Callout tone="warning" title="Il periodo è già finito">
      Il tema non si vede: cambia le date (o svuotale) se vuoi riattivarlo.
    </Callout>
  );
}
