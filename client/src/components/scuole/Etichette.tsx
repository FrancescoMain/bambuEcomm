"use client";

import { useCallback, useEffect, useState } from "react";

/** Quello che c'è sull'etichetta del negozio: codice del libro, cognome, nome e telefono (come in GS_MAG). */
export type Etichetta = { chiave: string | number; isbn: string; cognome: string; nome: string; telefono: string };

/** Larghezza × altezza dell'etichetta, in mm. */
export type Misura = { larghezza: number; altezza: number };

/** Misure delle etichette adesive più comuni per le stampanti termiche; le altre si scrivono a mano. */
export const FORMATI: Misura[] = [
  { larghezza: 50, altezza: 30 },
  { larghezza: 40, altezza: 30 },
  { larghezza: 62, altezza: 29 },
  { larghezza: 57, altezza: 32 },
  { larghezza: 100, altezza: 50 },
];

/** Limiti delle misure scritte a mano: dalla più piccola etichetta leggibile a un foglio A4. */
export const MISURA_MIN = 20;
export const MISURA_MAX = 297;

export const nomeMisura = (m: Misura) => `${m.larghezza} × ${m.altezza} mm`;

const valida = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= MISURA_MIN && n <= MISURA_MAX;

const CHIAVE = "scuole_etichette";
type Preferenze = Misura & { automatica: boolean };
// Stampa automatica attiva di partenza: sparato il libro esce l'etichetta (richiesta del negozio, 3 nov 2026)
const PREDEFINITE: Preferenze = { ...FORMATI[0], automatica: true };

/** Misura e stampa automatica, ricordate su questo computer (ogni postazione ha la sua stampante). */
export function usePreferenzeEtichette() {
  const [pref, setStato] = useState<Preferenze>(PREDEFINITE);
  useEffect(() => {
    try {
      const salvate = JSON.parse(localStorage.getItem(CHIAVE) ?? "null");
      if (!salvate) return;
      // Prima si salvava il nome del formato («50x30»)
      const [l, a] = typeof salvate.formato === "string" ? salvate.formato.split("x").map(Number) : [salvate.larghezza, salvate.altezza];
      setStato({
        larghezza: valida(l) && valida(a) ? l : PREDEFINITE.larghezza,
        altezza: valida(l) && valida(a) ? a : PREDEFINITE.altezza,
        automatica: typeof salvate.automatica === "boolean" ? salvate.automatica : PREDEFINITE.automatica,
      });
    } catch {
      // si usano le predefinite
    }
  }, []);
  const cambia = useCallback((p: Partial<Preferenze>) => {
    setStato((prima) => {
      const nuove = { ...prima, ...p };
      try {
        localStorage.setItem(CHIAVE, JSON.stringify(nuove));
      } catch {
        // valgono finché la pagina è aperta
      }
      return nuove;
    });
  }, []);
  return [pref, cambia] as const;
}

/**
 * La misura dell'etichetta: una di quelle comuni oppure «Altra misura…», con larghezza e altezza scritte a mano come
 * nelle impostazioni della stampante. Ogni misura valida vale subito e resta ricordata.
 */
export function SceltaMisura({ misura, onCambia }: { misura: Misura; onCambia: (m: Misura) => void }) {
  const comune = FORMATI.some((f) => f.larghezza === misura.larghezza && f.altezza === misura.altezza);
  const [aMano, setAMano] = useState(false);
  const [bozza, setBozza] = useState({ larghezza: String(misura.larghezza), altezza: String(misura.altezza) });
  useEffect(() => setBozza({ larghezza: String(misura.larghezza), altezza: String(misura.altezza) }), [misura.larghezza, misura.altezza]);
  const personalizzata = aMano || !comune;

  const scrivi = (campo: keyof Misura, testo: string) => {
    const nuova = { ...bozza, [campo]: testo };
    setBozza(nuova);
    const l = Number(nuova.larghezza.replace(",", "."));
    const a = Number(nuova.altezza.replace(",", "."));
    if (valida(l) && valida(a)) onCambia({ larghezza: l, altezza: a });
  };
  const campo = "w-16 rounded-lg border border-paper-line bg-white px-2 py-1 text-right text-[15px] invalid:border-magenta focus:border-brand-500 focus:outline-none";

  return (
    <span className="flex flex-wrap items-center gap-2 text-ink-soft">
      <label className="flex items-center gap-2">
        Etichetta
        <select
          value={personalizzata ? "altra" : nomeMisura(misura)}
          onChange={(e) => {
            const scelta = FORMATI.find((f) => nomeMisura(f) === e.target.value);
            setAMano(!scelta);
            if (scelta) onCambia(scelta);
          }}
          className="rounded-lg border border-paper-line bg-white px-2 py-1 text-[15px] focus:border-brand-500 focus:outline-none"
        >
          {FORMATI.map((f) => (
            <option key={nomeMisura(f)} value={nomeMisura(f)}>
              {nomeMisura(f)}
            </option>
          ))}
          <option value="altra">Altra misura…</option>
        </select>
      </label>
      {personalizzata && (
        <>
          <input
            type="number"
            inputMode="decimal"
            min={MISURA_MIN}
            max={MISURA_MAX}
            step="0.5"
            value={bozza.larghezza}
            onChange={(e) => scrivi("larghezza", e.target.value)}
            aria-label="Larghezza dell'etichetta in millimetri"
            className={campo}
          />
          ×
          <input
            type="number"
            inputMode="decimal"
            min={MISURA_MIN}
            max={MISURA_MAX}
            step="0.5"
            value={bozza.altezza}
            onChange={(e) => scrivi("altezza", e.target.value)}
            aria-label="Altezza dell'etichetta in millimetri"
            className={campo}
          />
          mm
        </>
      )}
    </span>
  );
}

/** Stampa le etichette: si montano i fogli, si apre la stampa del browser, poi si smontano. */
export function useStampaEtichette(onFine?: () => void) {
  const [etichette, setEtichette] = useState<Etichetta[] | null>(null);
  useEffect(() => {
    if (!etichette) return;
    const fine = () => {
      setEtichette(null);
      onFine?.();
    };
    window.addEventListener("afterprint", fine, { once: true });
    const t = setTimeout(() => window.print(), 50);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", fine);
    };
  }, [etichette]); // eslint-disable-line react-hooks/exhaustive-deps
  return [etichette, (e: Etichetta[]) => e.length && setEtichette(e)] as const;
}

/**
 * Un'etichetta per pagina, della misura scelta: va sulla stampante termica del negozio. Testo in maiuscolo e centrato
 * come le etichette che fanno oggi; il cognome è più grande perché è quello che si cerca sullo scaffale.
 */
export function FogliEtichette({ etichette, misura: f }: { etichette: Etichetta[]; misura: Misura }) {
  return (
    <div className="hidden text-black print:block">
      <style>{`@page { size: ${f.larghezza}mm ${f.altezza}mm; margin: 0; }`}</style>
      {etichette.map((e, i) => (
        <div
          key={e.chiave}
          className="flex flex-col items-center justify-center overflow-hidden text-center font-sans uppercase leading-tight"
          // Mezzo millimetro in meno: se il foglio sfora anche di poco, la stampante aggiunge un'etichetta bianca
          style={{ width: `${f.larghezza}mm`, height: `${f.altezza - 0.5}mm`, padding: "2mm", breakAfter: i < etichette.length - 1 ? "page" : "auto", breakInside: "avoid" }}
        >
          <span className="font-mono text-[9pt]">{e.isbn}</span>
          <span className="max-w-full truncate text-[12pt] font-extrabold">{e.cognome}</span>
          <span className="max-w-full truncate text-[10pt] font-bold">{e.nome}</span>
          {e.telefono && <span className="text-[9pt]">{e.telefono}</span>}
        </div>
      ))}
    </div>
  );
}
