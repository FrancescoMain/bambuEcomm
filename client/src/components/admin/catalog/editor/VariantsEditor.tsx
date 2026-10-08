"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Layers, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { errorMessage, uploadImage } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { isValidImageSrc } from "../utils";
import { uid, type VariantDraft, type VariantValueDraft } from "./formState";

const TYPE_SUGGESTIONS = ["Colore", "Taglia", "Formato", "Fantasia", "Modello", "Misura", "Rigatura"];

/** Varianti del prodotto (es. Colore: Rosso, Blu) con foto facoltativa per ogni scelta */
export function VariantsEditor({
  value,
  onChange,
  error,
}: {
  value: VariantDraft[];
  onChange: (value: VariantDraft[]) => void;
  error?: string | null;
}) {
  const focusKey = useRef<string | null>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusKey.current) return;
    const el = container.current?.querySelector<HTMLInputElement>(`[data-key="${focusKey.current}"]`);
    focusKey.current = null;
    el?.focus();
  });

  const updateType = (key: string, patch: Partial<VariantDraft>) =>
    onChange(value.map((t) => (t.key === key ? { ...t, ...patch } : t)));

  const updateValue = (typeKey: string, valueKey: string, patch: Partial<VariantValueDraft>) =>
    onChange(
      value.map((t) =>
        t.key === typeKey ? { ...t, valori: t.valori.map((v) => (v.key === valueKey ? { ...v, ...patch } : v)) } : t
      )
    );

  const addType = () => {
    const used = new Set(value.map((t) => t.nome.trim().toLowerCase()));
    const suggestion = TYPE_SUGGESTIONS.find((s) => !used.has(s.toLowerCase())) || "";
    const type: VariantDraft = { key: uid(), nome: suggestion, valori: [{ key: uid(), nome: "", immagine: null }] };
    focusKey.current = type.valori[0].key;
    onChange([...value, type]);
  };

  const addValue = (typeKey: string) => {
    const v: VariantValueDraft = { key: uid(), nome: "", immagine: null };
    focusKey.current = v.key;
    onChange(value.map((t) => (t.key === typeKey ? { ...t, valori: [...t.valori, v] } : t)));
  };

  const removeValue = (typeKey: string, valueKey: string) =>
    onChange(value.map((t) => (t.key === typeKey ? { ...t, valori: t.valori.filter((v) => v.key !== valueKey) } : t)));

  return (
    <div ref={container}>
      <datalist id="tipi-variante">
        {TYPE_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {value.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-paper-line px-4 py-8 text-center">
          <Layers className="h-7 w-7 text-ink-faint" />
          <p className="mt-2 text-[15px] font-semibold">Nessuna variante</p>
          <p className="mt-0.5 max-w-sm text-sm text-ink-muted">
            Aggiungile se il cliente deve scegliere, ad esempio, il colore o la fantasia. Il prezzo resta lo stesso.
          </p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={addType}>
            <Plus className="h-4 w-4" /> Aggiungi una variante
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {value.map((type, typeIndex) => (
            <div key={type.key} className="rounded-2xl border border-paper-line bg-paper/50 p-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label htmlFor={`tipo-${type.key}`} className="field-label">
                    Nome della variante
                  </label>
                  <input
                    id={`tipo-${type.key}`}
                    list="tipi-variante"
                    value={type.nome}
                    onChange={(e) => updateType(type.key, { nome: e.target.value })}
                    placeholder="Es. Colore"
                    className="field"
                    autoComplete="off"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onChange(value.filter((t) => t.key !== type.key))}
                  aria-label={`Elimina la variante ${type.nome || typeIndex + 1}`}
                  title="Elimina variante"
                  className="text-magenta-ink hover:bg-magenta-soft"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <p className="field-label mt-4">Scelte disponibili</p>
              <ul className="space-y-2">
                {type.valori.map((v, valueIndex) => (
                  <li key={v.key} className="flex items-center gap-2">
                    <VariantImagePicker
                      value={v.immagine}
                      label={v.nome || `scelta ${valueIndex + 1}`}
                      onChange={(immagine) => updateValue(type.key, v.key, { immagine })}
                    />
                    <input
                      data-key={v.key}
                      value={v.nome}
                      onChange={(e) => updateValue(type.key, v.key, { nome: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (v.nome.trim()) addValue(type.key);
                        }
                      }}
                      placeholder={valueIndex === 0 ? "Es. Rosso" : "Altra scelta"}
                      aria-label={`${type.nome || "Variante"}: scelta ${valueIndex + 1}`}
                      className="field flex-1"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => removeValue(type.key, v.key)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-paper-warm hover:text-magenta-ink"
                      aria-label={`Togli la scelta ${v.nome || valueIndex + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => addValue(type.key)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
              >
                <Plus className="h-4 w-4" /> Aggiungi scelta
              </button>
              <p className="mt-1 text-xs text-ink-muted">
                Suggerimento: premi Invio dopo aver scritto una scelta per aggiungerne subito un&apos;altra.
              </p>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addType}>
            <Plus className="h-4 w-4" /> Aggiungi un&apos;altra variante
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-sm font-medium text-magenta-ink">{error}</p>}
    </div>
  );
}

/** Foto piccola facoltativa per una scelta (es. la foto del colore) */
function VariantImagePicker({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    setLoading(true);
    try {
      onChange(await uploadImage(file, "products"));
    } catch (e) {
      toast.error(errorMessage(e, "Caricamento non riuscito"));
    } finally {
      setLoading(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={cn(
          "relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border bg-white text-ink-faint transition hover:border-brand-500 hover:text-brand-600",
          value ? "border-paper-line" : "border-dashed border-ink-faint/50"
        )}
        aria-label={value ? `Cambia foto di ${label}` : `Aggiungi foto per ${label} (facoltativa)`}
        title={value ? "Cambia foto" : "Foto facoltativa"}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isValidImageSrc(value) ? (
          <Image src={value} alt="" fill sizes="88px" className="object-contain p-0.5" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </button>
      {value && !loading && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white shadow"
          aria-label={`Togli foto di ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
