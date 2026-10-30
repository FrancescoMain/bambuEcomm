import { test } from "node:test";
import assert from "node:assert/strict";
import { abbina, csvOrdine, perCodice } from "../libriOrdini";

const libro = (id: number, isbn: string) => ({ id, isbn });
const riga = (isbn: string, prezzo = 10) => ({ isbn, titolo: `T${isbn}`, autori: "A", editore: "E", volume: "U", prezzo });

test("le copie libere vanno ai primi che hanno prenotato, il resto si ordina", () => {
  const libri = [libro(1, "A"), libro(2, "B"), libro(3, "A"), libro(4, "A")];
  const { coppie, daOrdinare } = abbina(libri, [
    { id: 10, isbn: "A" },
    { id: 11, isbn: "A" },
    { id: 12, isbn: "C" },
  ]);
  assert.deepEqual(coppie, [
    { rigaId: 10, libroId: 1 },
    { rigaId: 11, libroId: 3 },
  ]);
  assert.deepEqual(
    daOrdinare.map((l) => l.id),
    [2, 4]
  );
});

test("senza copie libere si ordina tutto", () => {
  const { coppie, daOrdinare } = abbina([libro(1, "A")], []);
  assert.deepEqual(coppie, []);
  assert.equal(daOrdinare.length, 1);
});

test("una riga per copia diventa una riga per codice con la quantità, in ordine di codice", () => {
  const g = perCodice([riga("978B", 12.5), riga("978A"), riga("978B", 12.5)]);
  assert.deepEqual(
    g.map((r) => [r.isbn, r.quantita, r.prezzo]),
    [
      ["978A", 1, 10],
      ["978B", 2, 12.5],
    ]
  );
});

test("il CSV è «codice;quantità» senza intestazione, come lo esportava GS_MAG", () => {
  assert.equal(csvOrdine([riga("978B"), riga("978A"), riga("978B")]), "978A;1\n978B;2\n");
  assert.equal(csvOrdine([]), "");
});
