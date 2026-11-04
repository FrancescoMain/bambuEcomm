import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEmail } from "../email";

test("le email si confrontano in minuscolo e senza spazi", () => {
  assert.equal(normalizeEmail("  Mario.Rossi@Gmail.COM "), "mario.rossi@gmail.com");
  assert.equal(normalizeEmail(undefined), "");
});

test("il dominio con accenti in punycode torna com'è salvato", () => {
  assert.equal(normalizeEmail("libri@xn--cartoleriabamb-jrb.com"), "libri@cartoleriabambù.com");
  assert.equal(normalizeEmail("Libri@XN--CartoleriaBamb-JRB.com"), "libri@cartoleriabambù.com");
  assert.equal(normalizeEmail("libri@cartoleriabambù.com"), "libri@cartoleriabambù.com");
});

test("xn-- nella parte prima della chiocciola non si tocca", () => {
  assert.equal(normalizeEmail("xn--prova@gmail.com"), "xn--prova@gmail.com");
});
