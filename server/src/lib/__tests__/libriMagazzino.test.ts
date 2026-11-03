import { test } from "node:test";
import assert from "node:assert/strict";
import { contaPerCodice, daDareDalNegozio, leggiQuantita, normalizzaIsbn } from "../libriMagazzino";

test("la quantità è un intero da 0 a 9999", () => {
  assert.equal(leggiQuantita("0"), 0);
  assert.equal(leggiQuantita(" 12 "), 12);
  assert.equal(leggiQuantita(3), 3);
  assert.equal(leggiQuantita("9999"), 9999);
  for (const v of ["", "-1", "1,5", "2.0", "10000", "abc", null, undefined]) assert.equal(leggiQuantita(v), null, String(v));
});

test("si danno dal negozio solo i libri che il cliente non ha ancora", () => {
  assert.equal(daDareDalNegozio("IN_LISTA"), true);
  assert.equal(daDareDalNegozio("PRENOTATO"), true);
  assert.equal(daDareDalNegozio("CONFERMATO"), true);
  assert.equal(daDareDalNegozio("ASSEGNATO"), false);
  assert.equal(daDareDalNegozio("RITIRATO"), false);
});

test("il codice letto perde spazi e trattini", () => {
  assert.equal(normalizzaIsbn(" 978-88-123 4567x "), "978881234567X");
});

test("conta le righe per codice", () => {
  const conti = contaPerCodice([{ isbn: "A" }, { isbn: "B" }, { isbn: "A" }]);
  assert.equal(conti.get("A"), 2);
  assert.equal(conti.get("B"), 1);
  assert.equal(conti.get("C"), undefined);
});
