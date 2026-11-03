import { test } from "node:test";
import assert from "node:assert/strict";
import { codiceCopia, contiVenditore, eCodiceCopia, leggiPercentuale, prezziUsato, sogliaAttesa, statoCopia } from "../libriUsato";

test("le percentuali vanno da 0 a 100, anche con la virgola", () => {
  assert.equal(leggiPercentuale("50"), 50);
  assert.equal(leggiPercentuale(" 37,5 "), 37.5);
  assert.equal(leggiPercentuale(0), 0);
  assert.equal(leggiPercentuale("100"), 100);
  for (const v of ["", "101", "-5", "abc", "1,234", null]) assert.equal(leggiPercentuale(v), null, String(v));
});

test("prezzi dell'usato: vendita = copertina meno lo sconto, acquisto = percentuale della copertina", () => {
  assert.deepEqual(prezziUsato(29.8, 50, 25), { prezzoVendita: 14.9, prezzoAcquisto: 7.45 });
  assert.deepEqual(prezziUsato(20.1, 40, 0), { prezzoVendita: 12.06, prezzoAcquisto: 0 });
  assert.deepEqual(prezziUsato(10, 0, 100), { prezzoVendita: 10, prezzoAcquisto: 10 });
});

test("il codice della copia ha 10 cifre e non si confonde con un ISBN", () => {
  assert.equal(codiceCopia(2026, 12), "2026000012");
  assert.equal(eCodiceCopia("2026000012"), true);
  assert.equal(eCodiceCopia("9788808196903"), false);
  assert.equal(eCodiceCopia("2026000000012"), false);
});

test("la soglia dell'attesa è oggi meno i giorni", () => {
  const oggi = new Date("2026-11-13T10:00:00Z");
  assert.equal(sogliaAttesa(10, oggi).toISOString(), "2026-11-03T10:00:00.000Z");
});

test("stato della copia e conti del venditore: si deve solo per le copie vendute", () => {
  const c = (libroId: number | null, stato: "ASSEGNATO" | "RITIRATO" | null, pagata = false) => ({
    libroId,
    pagataAt: pagata ? new Date() : null,
    libro: stato ? { stato } : null,
  });
  assert.equal(statoCopia(c(null, null)), "IN_NEGOZIO");
  assert.equal(statoCopia(c(1, "ASSEGNATO")), "ASSEGNATA");
  assert.equal(statoCopia(c(1, "RITIRATO")), "VENDUTA");
  assert.equal(statoCopia(c(1, "RITIRATO", true)), "PAGATA");
  assert.deepEqual(
    contiVenditore([
      { stato: "IN_NEGOZIO", prezzoAcquisto: 5 },
      { stato: "ASSEGNATA", prezzoAcquisto: 4 },
      { stato: "VENDUTA", prezzoAcquisto: 7.45 },
      { stato: "VENDUTA", prezzoAcquisto: 3 },
      { stato: "PAGATA", prezzoAcquisto: 6 },
    ]),
    { inNegozio: 2, vendute: 3, daPagare: 10.45, pagato: 6 }
  );
});
