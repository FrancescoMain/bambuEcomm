"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { StoreSettings } from "@/lib/types";
import { api, errorMessage, revalidateStorefront } from "@/lib/api/client";

export type SettingsKey = keyof StoreSettings;

/** Le sezioni segnalano qui se hanno modifiche non salvate (pallino nel menu) */
export const DirtyContext = createContext<((section: string, dirty: boolean) => void) | null>(null);

/** Impostazioni salvate più recenti, condivise tra le sezioni (es. soglia spedizione nelle anteprime) */
export const SavedSettingsContext = createContext<{
  settings: StoreSettings;
  onSaved: (settings: StoreSettings) => void;
} | null>(null);

const pick = <K extends SettingsKey>(s: StoreSettings, keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, s[k]])) as Pick<StoreSettings, K>;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Stato di una sezione delle impostazioni: bozza locale, salvataggio
 * (solo le chiavi modificate, con PUT /settings) e annullamento.
 */
export function useSettingsForm<K extends SettingsKey>({
  section,
  keys,
  validate,
}: {
  section: string;
  keys: readonly K[];
  validate?: (draft: Pick<StoreSettings, K>) => string[];
}) {
  const shared = useContext(SavedSettingsContext);
  if (!shared) throw new Error("useSettingsForm va usato dentro SettingsView");
  const { settings, onSaved } = shared;

  const [saved, setSaved] = useState(() => pick(settings, keys));
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const dirty = useMemo(() => !same(draft, saved), [draft, saved]);

  const report = useContext(DirtyContext);
  useEffect(() => {
    report?.(section, dirty);
  }, [report, section, dirty]);

  const update = useCallback(<P extends K>(key: P, value: (prev: StoreSettings[P]) => StoreSettings[P]) => {
    setDraft((d) => ({ ...d, [key]: value(d[key]) }));
    setErrors([]);
  }, []);

  const save = async () => {
    const problems = validate?.(draft) ?? [];
    setErrors(problems);
    if (problems.length) {
      toast.error(problems.length === 1 ? problems[0] : `Ci sono ${problems.length} cose da sistemare prima di salvare.`);
      return;
    }
    const changed = keys.filter((k) => !same(draft[k], saved[k]));
    if (!changed.length) return;
    setSaving(true);
    try {
      const body = Object.fromEntries(changed.map((k) => [k, draft[k]]));
      const res = await api<{ message: string; settings: StoreSettings }>("/settings", { method: "PUT", body });
      const next = pick(res.settings, keys);
      setSaved(next);
      setDraft(next);
      onSaved(res.settings);
      revalidateStorefront(["settings"]);
      toast.success("Modifiche salvate", { description: "Il sito si aggiorna entro pochi secondi." });
    } catch (e) {
      toast.error(errorMessage(e, "Salvataggio non riuscito, riprova."));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setDraft(saved);
    setErrors([]);
  };

  return { draft, update, save, reset, saving, dirty, errors, latest: settings };
}

/** Quello che serve alla barra di salvataggio */
export interface SaveState {
  dirty: boolean;
  saving: boolean;
  errors: string[];
  save: () => void;
  reset: () => void;
}
