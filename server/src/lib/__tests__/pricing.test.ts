import { test } from "node:test";
import assert from "node:assert/strict";
import {
  discountPercent,
  effectivePrice,
  isDiscountActive,
  priceFromPercent,
  validateDiscount,
  withPricing,
} from "../pricing";

const now = new Date("2026-10-08T10:00:00Z");

test("senza prezzo scontato vale il prezzo pieno", () => {
  const p = { prezzo: 10, prezzoScontato: null };
  assert.equal(isDiscountActive(p, now), false);
  assert.equal(effectivePrice(p, now), 10);
  assert.equal(discountPercent(p, now), null);
});

test("lo sconto attivo cambia prezzo e percentuale", () => {
  const p = { prezzo: "25.00", prezzoScontato: "18.75" };
  assert.equal(isDiscountActive(p, now), true);
  assert.equal(effectivePrice(p, now), 18.75);
  assert.equal(discountPercent(p, now), 25);
});

test("lo sconto rispetta la finestra di date", () => {
  const future = { prezzo: 10, prezzoScontato: 8, scontoInizio: "2026-11-01" };
  const expired = { prezzo: 10, prezzoScontato: 8, scontoFine: "2026-10-01" };
  const running = { prezzo: 10, prezzoScontato: 8, scontoInizio: "2026-10-01", scontoFine: "2026-10-31" };
  assert.equal(effectivePrice(future, now), 10);
  assert.equal(effectivePrice(expired, now), 10);
  assert.equal(effectivePrice(running, now), 8);
});

test("un prezzo scontato non inferiore al pieno viene ignorato", () => {
  assert.equal(effectivePrice({ prezzo: 10, prezzoScontato: 12 }, now), 10);
  assert.equal(effectivePrice({ prezzo: 10, prezzoScontato: 0 }, now), 10);
});

test("percentuale -> prezzo arrotondato al centesimo", () => {
  assert.equal(priceFromPercent(12.5, 20), 10);
  assert.equal(priceFromPercent(9.99, 15), 8.49);
  assert.equal(priceFromPercent(33.33, 33), 22.33);
});

test("validazione dello sconto", () => {
  assert.equal(validateDiscount(10, null), null);
  assert.equal(validateDiscount(10, 8), null);
  assert.match(validateDiscount(10, 10) || "", /inferiore/);
  assert.match(validateDiscount(10, -1) || "", /maggiore di zero/);
  assert.match(validateDiscount(10, 8, new Date("2026-10-10"), new Date("2026-10-01")) || "", /successiva/);
});

test("withPricing converte i Decimal e aggiunge i campi calcolati", () => {
  const out = withPricing({ prezzo: "28", prezzoScontato: "21", titolo: "Borsa" }, now);
  assert.equal(out.prezzo, 28);
  assert.equal(out.prezzoScontato, 21);
  assert.equal(out.prezzoFinale, 21);
  assert.equal(out.scontoPercentuale, 25);
  assert.equal(out.inOfferta, true);
  assert.equal(out.titolo, "Borsa");
});
