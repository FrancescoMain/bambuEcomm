// Eseguito da `npm install` (anche durante le build Vercel).
// Le migrazioni si applicano SOLO nei deploy di produzione: le anteprime dei rami
// (che su Vercel possono avere le stesse variabili, quindi lo stesso database) e le
// installazioni in locale non devono mai modificare il database del negozio.
const { execSync } = require("child_process");

const env = process.env.VERCEL_ENV;
if (env === "production") {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} else {
  console.log(`Migrazioni del database saltate (ambiente: ${env || "locale"}).`);
}
