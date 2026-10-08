import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanPersonalization, variantKeyOf } from "../cartPricing";
import { DEFAULT_SETTINGS, shippingCostFor, shippingMethodError } from "../settings";

test("la firma delle varianti non dipende dall'ordine delle chiavi", () => {
  const a = variantKeyOf({ "53": { id: 320, nome: "M" }, "52": { id: 310, nome: "Rosso" } });
  const b = variantKeyOf({ "52": { id: 310, nome: "Rosso" }, "53": { id: 320, nome: "M" } });
  assert.equal(a, "52:310|53:320");
  assert.equal(a, b);
});

test("colori diversi dello stesso prodotto sono righe diverse", () => {
  assert.notEqual(variantKeyOf({ "1": { id: 1, nome: "Lilla" } }), variantKeyOf({ "1": { id: 2, nome: "Fucsia" } }));
});

test("la personalizzazione entra nella firma (senza distinguere maiuscole/spazi)", () => {
  const v = { "1": { id: 1, nome: "Blu" } };
  assert.equal(variantKeyOf(v, "  Giulia "), variantKeyOf(v, "giulia"));
  assert.notEqual(variantKeyOf(v, "Giulia"), variantKeyOf(v, "Marco"));
  assert.equal(variantKeyOf(null, null), "");
});

test("cleanPersonalization taglia e normalizza", () => {
  assert.equal(cleanPersonalization("  a   b  "), "a b");
  assert.equal(cleanPersonalization(""), null);
  assert.equal(cleanPersonalization("x".repeat(500))?.length, 120);
});

test("spese di spedizione: soglia gratuita, ritiro e consegna in giornata", () => {
  const s = DEFAULT_SETTINGS;
  assert.equal(shippingCostFor(s, 10, "spedizione"), s.spedizione.costo);
  assert.equal(shippingCostFor(s, s.spedizione.sogliaGratuita, "spedizione"), 0);
  assert.equal(shippingCostFor(s, 10, "ritiro"), 0);
  assert.equal(shippingCostFor(s, 100, "giornata"), s.spedizione.giornata.costo);
});

test("consegna in giornata: disattivata, CAP non coperto, orario limite", () => {
  const off = DEFAULT_SETTINGS;
  assert.match(shippingMethodError(off, "giornata", "80058") || "", /non è al momento disponibile/);
  const on = {
    ...DEFAULT_SETTINGS,
    spedizione: { ...DEFAULT_SETTINGS.spedizione, giornata: { ...DEFAULT_SETTINGS.spedizione.giornata, attivo: true } },
  };
  // Mercoledì 7 ottobre 2026, 09:00 ora italiana
  const morning = new Date("2026-10-07T07:00:00Z");
  const evening = new Date("2026-10-07T17:00:00Z");
  assert.equal(shippingMethodError(on, "giornata", "80058", morning), null);
  assert.match(shippingMethodError(on, "giornata", "20100", morning) || "", /CAP/);
  assert.match(shippingMethodError(on, "giornata", "80058", evening) || "", /entro le/);
  assert.equal(shippingMethodError(on, "spedizione", "20100", evening), null);
});
