# Messa in produzione del redesign

Checklist per pubblicare il ramo `redesign-performance` su Vercel (frontend `client/`, API `server/`).

## 1. Database
- La migrazione `server/prisma/migrations/20261008120000_storefront_redesign_discounts` è **solo additiva**
  (nuove colonne e tabelle, nessun dato eliminato). Viene applicata in automatico **solo dal deploy di
  produzione** (il `postinstall` del server lancia `prisma migrate deploy` quando `VERCEL_ENV=production`):
  le anteprime dei rami e le installazioni in locale non toccano il database. Per questo si pubblica con
  un merge su `main`, non promuovendo un'anteprima.
- Fai comunque un backup prima del deploy: da Supabase (Database → Backups) oppure, senza accesso alla
  dashboard, con `pg_dump` usando la stringa di connessione salvata su Vercel.
- `DATABASE_URL` deve usare il **pooler in modalità transaction** di Supabase (porta 6543) con
  `?pgbouncer=true&connection_limit=1`; `DIRECT_URL` la connessione diretta (porta 5432) per le migrazioni.

## 2. Regione delle funzioni (la causa principale della lentezza)
Il vecchio sito eseguiva l'API a Washington (`iad1`) mentre il database Supabase è a Francoforte
(`eu-central-1`): ogni query attraversava l'Atlantico e ogni chiamata API impiegava ~2 secondi anche "a caldo".
Ora `server/vercel.json` e `client/vercel.json` fissano le funzioni di entrambi i progetti a **`fra1`**
(Francoforte), accanto al database: nella dashboard di Vercel non serve cambiare nulla.
Dopo il deploy l'intestazione `x-vercel-id` delle risposte dell'API deve contenere `fra1::fra1::`
(prima era `fra1::iad1::`).

## 3. Variabili d'ambiente
### API (`server`)
| Variabile | Note |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | vedi sopra |
| `JWT_SECRET` | **obbligatoria prima del deploy**: senza, in produzione login, area clienti e pannello non funzionano (il vecchio codice ripiegava sulla chiave pubblica `your-secret-key`, con cui chiunque poteva fingersi amministratore). Generala con `openssl rand -hex 32` e salvala come **Sensitive**; se cambia, tutti dovranno rifare l'accesso |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | già presenti |
| `FRONTEND_URL` | es. `https://www.xn--cartoleriabamb-jrb.com` (link nelle email e ritorno da Stripe) |
| `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_EMAIL` | già presenti |
| `CLOUDINARY_*` | già presenti |
| `REVALIDATE_SECRET` | nuova, facoltativa: stessa stringa casuale anche nel frontend; aggiorna subito le pagine dopo le modifiche |
| `CRON_SECRET` | nuova, consigliata: protegge il cron notturno (`/api/cleanup-carts`, ogni notte alle 3) che svuota i carrelli fermi da 48 ore e annulla i checkout mai completati |

### Frontend (`client`)
| Variabile | Note |
|---|---|
| `NEXT_PUBLIC_API_URL` | già presente (es. `https://bambu-ecomm-in2g.vercel.app/api`) |
| `NEXT_PUBLIC_SITE_URL` | facoltativa, default `https://www.xn--cartoleriabamb-jrb.com` |
| `REVALIDATE_SECRET` | vedi sopra |
| `NEXT_PUBLIC_GA_ID` | facoltativa, default `G-6680SVPRN1` |
| `NEXT_PUBLIC_META_PIXEL_ID` | facoltativa: attiva il Meta Pixel (solo dopo consenso cookie) |

## 4. Stripe
- Webhook (Developers → Webhooks) verso `https://<api>/api/webhook` con gli eventi:
  `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`, `checkout.session.expired`.
- Metodi di pagamento: il checkout non forza più solo la carta, quindi PayPal, Klarna e gli altri
  metodi si attivano da Settings → Payment methods senza toccare il codice.
- Le sessioni create dal vecchio sito prima del deploy vengono ancora gestite (percorso "legacy" nel webhook).
- Come funziona: al clic su "Paga" l'ordine viene creato "in attesa di pagamento" (con l'eventuale codice
  sconto già prenotato) e Stripe riceve solo il suo numero. Il webhook lo conferma solo se la sessione
  è proprio quella dell'ordine; se il pagamento fallisce o la sessione scade (24 ore) l'ordine viene
  annullato e il codice sconto torna disponibile. Gli eventi ripetuti da Stripe non creano doppioni.
- `ADMIN_EMAIL` riceve un avviso se arriva un pagamento per un ordine già annullato o se l'importo
  incassato non coincide con il totale: in quei casi controlla l'ordine prima di spedire.
- Se l'invio dell'email di conferma fallisce, il webhook risponde con errore e Stripe ritenta più tardi
  (l'ordine resta comunque confermato e l'email parte una sola volta).

## 5. Il giorno del deploy
- Meglio la sera o in un momento tranquillo: sito e API vengono ricompilati insieme e per qualche minuto
  il vecchio sito può parlare con la nuova API (il checkout potrebbe non andare).
- Se la build del sito fallisce perché l'API nuova non era ancora online, rilanciala: **Redeploy** da
  Vercel oppure un commit vuoto su `main` (`git commit --allow-empty -m "Ricostruisci il sito"`).

## 6. Dopo il deploy
1. Apri `/dashboard/impostazioni` e controlla spedizioni, banner, contatti, orari e P.IVA.
2. Prova un ordine reale di pochi euro (o in modalità test) e verifica le email.
3. In Google Search Console invia `https://<dominio>/sitemap.xml`.
4. (Facoltativo) In Google Merchant Center aggiungi il feed `https://<dominio>/feed/google`.

## Sicurezza: da fare subito
- **`JWT_SECRET` mancava in produzione** (verificato l'8/10/2026): il sito vecchio firma i login con la chiave
  pubblica `your-secret-key`. Aggiungila su Vercel (Sensitive) e fai **Redeploy** della produzione attuale,
  senza aspettare la nuova versione: chi è collegato dovrà rifare l'accesso.
- **Incidente Vercel di aprile 2026**: le variabili non segnate come "Sensitive" di una parte dei clienti sono
  state lette; Vercel raccomanda di considerarle esposte, cambiarle e salvarle come Sensitive. Su questo progetto
  sono segnalate ("Needs Attention") `DATABASE_URL` (cambiare anche `DIRECT_URL`, stessa password), `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET` (Stripe permette di tenere valida la vecchia chiave per qualche ora), `RESEND_API_KEY`,
  `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Il cambio password del database ferma il sito fino al redeploy:
  farlo di sera, tutto insieme, con un solo Redeploy.
- Il file `server/.env.local` era nel repository **pubblico** su GitHub. Nell'ultima versione è vuoto
  (0 byte), quindi lì non ci sono chiavi; controlla nella cronologia del file su GitHub che le versioni
  precedenti non ne contenessero: in quel caso (database, Stripe, Cloudinary, JWT, Resend) vanno **ruotate**.
- Sono stati chiusi: upload immagini senza login, endpoint email di test pubblico, pulizia carrelli di test
  pubblica, prezzi del checkout decisi dal browser, chiave JWT di default (vedi sopra).
- Ordini fatti come ospite: prima comparivano in automatico nel profilo di chiunque si registrasse con
  quella email (le email non vengono verificate, quindi bastava registrarsi con l'email di un altro per
  vederne nome, indirizzo e telefono). Ora il cliente li collega da **Account → I miei ordini** con un
  link di conferma inviato a quell'email (valido 2 ore).
