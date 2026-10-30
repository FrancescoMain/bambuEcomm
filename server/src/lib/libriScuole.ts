import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { normalizzaClasse, type LibroMiur } from "./miur";

// Regole delle schede scuola (ex Schede Scuole di GS_MAG), separate dalle rotte per poterle testare.

const LIMITE_TESTO = 300;

export type LibroInput = {
  isbn: string;
  materia: string;
  autori: string;
  titolo: string;
  volume: string;
  editore: string;
  prezzo: number;
  nuovaAdozione: boolean;
  daAcquistare: boolean;
  consigliato: boolean;
};

const CAMPI_OBBLIGATORI: [keyof LibroInput, string][] = [
  ["isbn", "il codice (ISBN)"],
  ["materia", "la materia"],
  ["autori", "gli autori"],
  ["titolo", "il titolo"],
  ["volume", "il volume"],
  ["editore", "l'editore"],
];

/** Valida una riga libro inserita a mano: tutti i campi obbligatori e prezzo diverso da zero, come in GS_MAG. */
export function validaLibro(body: any): { libro: LibroInput } | { errore: string } {
  const testo = (k: string) => String(body?.[k] ?? "").trim();
  for (const [campo, nome] of CAMPI_OBBLIGATORI) {
    const v = testo(campo);
    if (!v) return { errore: `Inserire ${nome}.` };
    if (v.length > LIMITE_TESTO) return { errore: `Il campo ${campo} è troppo lungo.` };
  }
  const prezzo = Number(String(body?.prezzo ?? "").replace(",", "."));
  if (!Number.isFinite(prezzo) || prezzo <= 0 || prezzo > 9999) return { errore: "Inserire il prezzo." };
  return {
    libro: {
      isbn: testo("isbn").replace(/[\s-]/g, "").toUpperCase(),
      materia: testo("materia"),
      autori: testo("autori"),
      titolo: testo("titolo"),
      volume: testo("volume"),
      editore: testo("editore"),
      prezzo: Math.round(prezzo * 100) / 100,
      nuovaAdozione: body?.nuovaAdozione === true,
      daAcquistare: body?.daAcquistare === true,
      consigliato: body?.consigliato === true,
    },
  };
}

/** Testata della scheda: anno solare, classe obbligatoria («1A»), corso libero. */
export function validaScheda(body: any): { anno: number; classe: string; corso: string } | { errore: string } {
  const anno = Number(body?.anno);
  const classe = normalizzaClasse(body?.classe);
  const corso = String(body?.corso ?? "").trim();
  if (!Number.isInteger(anno) || anno < 2000 || anno > 2100) return { errore: "Inserire l'anno." };
  if (!classe) return { errore: "Inserire la classe." };
  if (classe.length > 20 || corso.length > LIMITE_TESTO) return { errore: "Classe o corso troppo lunghi." };
  return { anno, classe, corso };
}

/** Totale della scheda = somma dei prezzi di tutte le righe (anche i consigliati), come in GS_MAG. */
export const totaleScheda = (libri: { prezzo: Prisma.Decimal | number | string }[]) =>
  Math.round(libri.reduce((t, l) => t + Number(l.prezzo), 0) * 100) / 100;

/** Raggruppa i libri del Ministero per classe, tenendo la combinazione (indirizzo) della classe. */
export function raggruppaPerClasse(libri: LibroMiur[]) {
  const classi = new Map<string, { combinazione: string; libri: LibroMiur[] }>();
  for (const l of libri) {
    const c = classi.get(l.classe) ?? { combinazione: l.combinazione, libri: [] };
    if (!c.libri.some((x) => x.isbn === l.isbn)) c.libri.push(l);
    classi.set(l.classe, c);
  }
  return classi;
}

export type EsitoImport = { schedeCreate: number; libriAggiunti: number; libriGiaPresenti: number };

/**
 * Porta i libri del Ministero nelle schede dell'anno: crea le classi che mancano (corso = indirizzo del
 * Ministero) e aggiunge i libri non ancora presenti. Le righe già presenti non si toccano, come in GS_MAG.
 * Una classe esistente viene riconosciuta dal nome, qualunque sia il corso.
 */
export async function importaLibriMinistero(
  scuolaId: number,
  anno: number,
  libri: LibroMiur[],
  soloScheda?: { id: number; classe: string }
): Promise<EsitoImport> {
  const esito: EsitoImport = { schedeCreate: 0, libriAggiunti: 0, libriGiaPresenti: 0 };
  const classi = raggruppaPerClasse(libri);
  await prisma.$transaction(
    async (tx) => {
      for (const [classe, { combinazione, libri: righe }] of classi) {
        if (soloScheda && classe !== soloScheda.classe) continue;
        let schedaId = soloScheda?.id;
        if (!schedaId) {
          const esistente = await tx.schedaScuola.findFirst({
            where: { scuolaId, anno, classe },
            orderBy: { id: "asc" },
            select: { id: true },
          });
          schedaId =
            esistente?.id ??
            (await tx.schedaScuola.create({ data: { scuolaId, anno, classe, corso: combinazione }, select: { id: true } }))
              .id;
          if (!esistente) esito.schedeCreate++;
        }
        const { count } = await tx.schedaScuolaLibro.createMany({
          data: righe.map(({ classe: _c, combinazione: _k, ...l }) => ({ ...l, schedaId: schedaId! })),
          skipDuplicates: true,
        });
        esito.libriAggiunti += count;
        esito.libriGiaPresenti += righe.length - count;
      }
    },
    { timeout: 60_000 }
  );
  return esito;
}
