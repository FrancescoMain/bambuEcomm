# CLAUDE.md

Guida per lavorare su questo repository (e-commerce **Cartoleria Bambù**, Torre Annunziata).

## Struttura
- `client/` — Next.js 15 (App Router) + React 19 + TypeScript + Tailwind 3. Storefront e pannello admin.
- `server/` — API Express 5 + Prisma 6 + PostgreSQL (Supabase). Deploy come funzione serverless Vercel (`server/api/index.ts`).
- `docs/` — `DEPLOY.md` (checklist di produzione), `FUNZIONALITA.md` (confronto con cartoleriavarzi.com).

## Comandi
```bash
# client
cd client && npm run dev        # http://localhost:3000 (Turbopack)
npm run build && npm run start   # build di produzione
npx tsc --noEmit -p .            # typecheck

# server
cd server && npm run dev         # nodemon + ts-node, porta $PORT (default 5000)
npx tsc --noEmit -p .
npx prisma migrate dev           # nuove migrazioni (solo DB locale!)
```
Ambiente locale consigliato: Postgres in Docker e `stripe/stripe-mock`; nel server `STRIPE_MOCK_URL=http://127.0.0.1:12111`
fa puntare Stripe al mock. Nel client `.env.local` con `NEXT_PUBLIC_API_URL`/`API_URL` verso l'API locale.
Non eseguire mai migrazioni contro il database di produzione: il `postinstall` del server
(`server/scripts/postinstall.js`) lancia `prisma migrate deploy` solo nei deploy di produzione su Vercel
(`VERCEL_ENV=production`; anteprime dei rami e installazioni locali lo saltano), quindi le migrazioni
devono restare additive: per qualche minuto la versione precedente gira sul nuovo schema.

## Architettura frontend
- Route group `src/app/(shop)/` = storefront con header/footer (layout carica categorie e impostazioni lato server).
  `src/app/dashboard/` = pannello admin (client, protetto da `AdminShell`).
- Le pagine pubbliche sono **Server Components** con dati da `src/lib/api/server.ts` (fetch con
  `next.revalidate` + tag `products`, `product:<id>`, `categories`, `settings`, `posts`).
  Dopo una modifica admin si chiama `revalidateStorefront(tags)` (`src/lib/api/client.ts`) → `/api/revalidate`.
- Stato client con Zustand (`src/store/`): `auth` (token in localStorage `token`), `cart` (righe + ricalcolo
  prezzi dal server via `POST /cart/quote`, sincronizzato col DB per gli utenti loggati), `wishlist`, `ui`.
- Immagini: `next/image` con loader custom (`src/lib/image-loader.ts`) che chiede a Cloudinary la versione ridimensionata.
- Design system: token in `tailwind.config.ts` (ink, paper, brand, magenta = sconti, orange, sky, leaf),
  primitive in `src/components/ui/`, componenti negozio in `src/components/shop/`.
- URL prodotto: `/product/<id>-<slug>` (i vecchi `/product/<id>` fanno redirect 308).

## Architettura backend
- `src/lib/prisma.ts` — **un solo** PrismaClient condiviso (non crearne altri).
- `src/lib/pricing.ts` — prezzo scontato (`prezzoScontato` + finestra `scontoInizio/scontoFine`), `withPricing()`.
- `src/lib/catalog.ts` — liste prodotti in SQL (filtri, ordinamento sul prezzo effettivo, facette).
- `src/lib/cartPricing.ts` — ricalcolo del carrello: i prezzi del browser sono sempre ignorati.
- `src/lib/settings.ts` — impostazioni negozio (spedizioni, banner, FAQ…) salvate in `Setting` (JSON).
- `src/lib/http.ts` — cache CDN per le GET pubbliche (`publicCache`), rate limit, `runInBackground` (waitUntil).
- Checkout: `POST /api/checkout-session` crea l'ordine `AWAITING_PAYMENT` e la sessione Stripe con solo
  `metadata.orderId`; il webhook (`src/routes/webhook.routes.ts`) conferma l'ordine in modo idempotente.

## Convenzioni
- Testi dell'interfaccia e commenti in italiano.
- Migrazioni Prisma solo additive; i nomi dei campi seguono lo schema esistente (italiano).
- Nessun segreto nel repository (`.env*` sono ignorati).
