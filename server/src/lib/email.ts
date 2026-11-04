import { domainToUnicode } from "node:url";

/**
 * Email confrontate senza distinzione tra maiuscole e minuscole.
 * I campi type="email" dei browser mandano i domini con accenti in punycode
 * (cartoleriabambù.com → xn--cartoleriabamb-jrb.com): li riportiamo alla forma salvata.
 */
export const normalizeEmail = (value: unknown) => {
  const email = String(value ?? "").trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 0 || !email.includes("xn--")) return email;
  return email.slice(0, at + 1) + (domainToUnicode(email.slice(at + 1)) || email.slice(at + 1));
};
