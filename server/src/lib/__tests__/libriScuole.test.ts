import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dividiClasse,
  leggiFlag,
  leggiPrezzo,
  normalizzaClasse,
  normalizzaCodiceScuola,
  rigaInLibro,
} from "../miur";
import { raggruppaPerClasse, totaleScheda, validaLibro, validaScheda } from "../libriScuole";

test("il codice scuola è di 10 lettere e cifre, niente altro finisce nella query", () => {
  assert.equal(normalizzaCodiceScuola(" naps930006 "), "NAPS930006");
  assert.equal(normalizzaCodiceScuola("NAPS93000"), null);
  assert.equal(normalizzaCodiceScuola('NA" || 1=1'), null);
});

test("la classe si scrive attaccata e la sezione può avere più lettere", () => {
  assert.equal(normalizzaClasse("1 a"), "1A");
  assert.deepEqual(dividiClasse("1A"), { annoCorso: 1, sezione: "A" });
  assert.deepEqual(dividiClasse("3asa"), { annoCorso: 3, sezione: "ASA" });
  assert.equal(dividiClasse("IA"), null);
  assert.equal(dividiClasse('1A" || true'), null);
});

test("prezzi e flag come li scrive il Ministero", () => {
  assert.equal(leggiPrezzo("29,30"), 29.3);
  assert.equal(leggiPrezzo("1.020,00"), 1020);
  assert.equal(leggiPrezzo("8.31"), 8.31);
  assert.equal(leggiPrezzo("ND"), 0);
  assert.equal(leggiFlag("Si"), true);
  assert.equal(leggiFlag("SI"), true);
  assert.equal(leggiFlag("No"), false);
  assert.equal(leggiFlag("Mo"), false);
});

const riga = {
  annocorso: "3",
  sezioneanno: "ASA",
  combinazione: "LICEO SCIENTIFICO - OPZIONE SCIENZE APPLICATE",
  codiceisbn: "9788858356012",
  disciplina: "ITALIANO",
  autori: "BOLOGNA CORRADO",
  titolo: "LEGGERE E SCRIVERE IL MONDO",
  volume: "1",
  editore: "LOESCHER EDITORE",
  prezzo: "24,90",
  nuovaadoz: "No",
  daacquist: "Si",
  consigliato: "No",
};

test("una riga del CSV diventa un libro della classe", () => {
  assert.deepEqual(rigaInLibro(riga), {
    classe: "3ASA",
    combinazione: "LICEO SCIENTIFICO - OPZIONE SCIENZE APPLICATE",
    isbn: "9788858356012",
    materia: "ITALIANO",
    autori: "BOLOGNA CORRADO",
    titolo: "LEGGERE E SCRIVERE IL MONDO",
    volume: "1",
    editore: "LOESCHER EDITORE",
    prezzo: 24.9,
    nuovaAdozione: false,
    daAcquistare: true,
    consigliato: false,
  });
  assert.equal(rigaInLibro({ ...riga, codiceisbn: "" }), null);
});

test("i libri si raggruppano per classe senza ISBN doppi", () => {
  const a = rigaInLibro(riga)!;
  const b = rigaInLibro({ ...riga, sezioneanno: "B", combinazione: "ORDINARIO" })!;
  const classi = raggruppaPerClasse([a, a, b]);
  assert.deepEqual([...classi.keys()], ["3ASA", "3B"]);
  assert.equal(classi.get("3ASA")!.libri.length, 1);
  assert.equal(classi.get("3B")!.combinazione, "ORDINARIO");
});

test("riga inserita a mano: campi obbligatori e prezzo diverso da zero", () => {
  const ok = { isbn: "978-88-08 49448-1", materia: "Storia", autori: "Barbero", titolo: "La storia", volume: "2", editore: "Zanichelli", prezzo: "29,30" };
  const v = validaLibro(ok);
  assert.ok("libro" in v);
  assert.equal(v.libro.isbn, "9788808494481");
  assert.equal(v.libro.prezzo, 29.3);
  assert.equal(v.libro.nuovaAdozione, false);
  assert.deepEqual(validaLibro({ ...ok, editore: " " }), { errore: "Inserire l'editore." });
  assert.deepEqual(validaLibro({ ...ok, prezzo: 0 }), { errore: "Inserire il prezzo." });
});

test("testata: anno solare e classe obbligatori, classe normalizzata", () => {
  assert.deepEqual(validaScheda({ anno: 2026, classe: "1 a", corso: " Tempo pieno " }), {
    anno: 2026,
    classe: "1A",
    corso: "Tempo pieno",
  });
  assert.deepEqual(validaScheda({ anno: "", classe: "1A" }), { errore: "Inserire l'anno." });
  assert.deepEqual(validaScheda({ anno: 2026, classe: "" }), { errore: "Inserire la classe." });
});

test("il totale somma tutti i libri, anche i consigliati", () => {
  assert.equal(totaleScheda([{ prezzo: "24.90" }, { prezzo: 8.31 }, { prezzo: "0.10" }]), 33.31);
  assert.equal(totaleScheda([]), 0);
});
