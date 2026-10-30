import { test } from "node:test";
import assert from "node:assert/strict";
import {
  barcodeScheda,
  leggiBarcode,
  leggiImporto,
  modificabile,
  passaggio,
  totaliCliente,
  validaTestataCliente,
} from "../libriClienti";

test("il barcode è anno + numero su 9 cifre, come in GS_MAG, e si rilegge", () => {
  assert.equal(barcodeScheda(2026, 12), "2026000000012");
  assert.deepEqual(leggiBarcode(" 2026000000012 "), { anno: 2026, numero: 12 });
  assert.equal(leggiBarcode("2026000000000"), null);
  assert.equal(leggiBarcode("202600000012"), null);
  assert.equal(leggiBarcode("ROSSI"), null);
});

test("prenota e ritira vanno avanti con la data, togli e annulla ritiro la azzerano", () => {
  const adesso = new Date("2026-10-30T10:00:00Z");
  assert.deepEqual(passaggio("prenota", adesso), {
    da: "IN_LISTA",
    a: "PRENOTATO",
    dati: { stato: "PRENOTATO", prenotatoAt: adesso },
  });
  assert.deepEqual(passaggio("togli", adesso).dati, { stato: "IN_LISTA", prenotatoAt: null });
  assert.equal(passaggio("ritira", adesso).da, "ASSEGNATO");
  assert.deepEqual(passaggio("annullaRitiro", adesso).dati, { stato: "ASSEGNATO", ritiratoAt: null });
});

test("si modificano solo i libri non ancora ordinati", () => {
  assert.equal(modificabile("IN_LISTA"), true);
  assert.equal(modificabile("PRENOTATO"), true);
  assert.equal(modificabile("CONFERMATO"), false);
  assert.equal(modificabile("RITIRATO"), false);
});

test("da pagare = libri prenotati (e successivi) meno l'acconto; la lista conta tutto", () => {
  const t = totaliCliente(
    [
      { prezzo: "20.10", stato: "IN_LISTA" },
      { prezzo: 10.2, stato: "PRENOTATO" },
      { prezzo: "5.05", stato: "RITIRATO" },
    ],
    "10"
  );
  assert.deepEqual(t, { lista: 35.35, prenotati: 15.25, acconto: 10, daPagare: 5.25 });
});

test("l'acconto accetta la virgola e rifiuta importi negativi o sballati", () => {
  assert.equal(leggiImporto("12,50"), 12.5);
  assert.equal(leggiImporto(""), 0);
  assert.equal(leggiImporto("-3"), null);
  assert.equal(leggiImporto("abc"), null);
});

test("la testata vuole cognome, nome, scuola e classe; il codice fiscale non serve", () => {
  assert.deepEqual(validaTestataCliente({ cognome: "Rossi", nome: "", scuolaId: 1, classe: "1A" }), {
    errore: "Inserire il nome.",
  });
  assert.deepEqual(validaTestataCliente({ cognome: "Rossi", nome: "Anna", scuolaId: 0, classe: "1A" }), {
    errore: "Scegliere la scuola.",
  });
  const ok = validaTestataCliente({ cognome: " Rossi ", nome: "Anna", scuolaId: "3", classe: "1 a", acconto: "20" });
  assert.ok("testata" in ok);
  assert.equal(ok.testata.classe, "1A");
  assert.equal(ok.testata.acconto, 20);
  assert.equal(ok.testata.telefono, "");
});
