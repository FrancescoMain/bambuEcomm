import { test } from "node:test";
import assert from "node:assert/strict";
import { scegliCopia } from "../libriBolle";

const giorno = (g: number) => new Date(2026, 8, g);

test("la copia arrivata va al cliente che ha prenotato per primo", () => {
  const scelta = scegliCopia([
    { id: 1, libroId: 10, prenotatoAt: giorno(5) },
    { id: 2, libroId: 11, prenotatoAt: giorno(2) },
    { id: 3, libroId: null, prenotatoAt: null },
  ]);
  assert.equal(scelta?.id, 2);
});

test("a parità di data vince la prenotazione inserita prima", () => {
  const scelta = scegliCopia([
    { id: 1, libroId: 12, prenotatoAt: giorno(2) },
    { id: 2, libroId: 11, prenotatoAt: giorno(2) },
  ]);
  assert.equal(scelta?.libroId, 11);
});

test("senza clienti si evade la copia per il negozio più vecchia", () => {
  const scelta = scegliCopia([
    { id: 7, libroId: null, prenotatoAt: null },
    { id: 4, libroId: null, prenotatoAt: null },
  ]);
  assert.equal(scelta?.id, 4);
});

test("niente in ordine: nessuna copia", () => {
  assert.equal(scegliCopia([]), null);
});
