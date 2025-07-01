# ✅ SEO QUICK START CHECKLIST - CARTOLERIA BAMBÙ

## 🚀 AZIONI IMMEDIATE (PROSSIMI 7 GIORNI)

### 1. METADATA GLOBALI

- [x] Layout.tsx: Aggiornare title e description
- [x] Aggiungere Open Graph tags
- [x] Implementare Twitter Cards
- [x] Configurare viewport e charset

### 2. HOMEPAGE SEO

- [x] Title ottimizzato: "Cartoleria Bambù | Cancelleria Torre Annunziata | Quaderni Penne Online"
- [x] Meta description: "Cartoleria Bambù a Torre Annunziata dal 2016. Quaderni, penne, cancelleria online. Consegna rapida in Campania. ⭐"
- [x] H1: "Cartoleria Bambù Torre Annunziata"
- [x] Ottimizzare hero section con keywords
- [x] Structured Data LocalBusiness implementato

### 3. ROBOTS.TXT

✅ **COMPLETATO** - robots.txt creato in /public/

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/
Disallow: /cart
Disallow: /checkout

Sitemap: https://cartoleriabambu.com/sitemap.xml
```

### 4. SITEMAP.XML

- [x] Implementare generazione automatica (sitemap.ts)
- [x] Include: homepage, chi-siamo, products, search
- [x] Exclude: dashboard, cart, checkout, api
- [x] Priorità e changeFrequency configurate

### 5. GOOGLE SEARCH CONSOLE

- [ ] Aggiungere proprietà
- [ ] Verificare ownership
- [ ] Inviare sitemap
- [ ] Configurare data highlighting

### 6. GOOGLE ANALYTICS 4

- [ ] Setup GA4
- [ ] Configurare e-commerce tracking
- [ ] Impostare goal conversioni
- [ ] Collegare con Search Console

---

## 🎯 KEYWORDS PRIMARIE

### Locali (Priorità Massima)

1. **"cartoleria Torre Annunziata"** - Volume: ~100/mese
2. **"cancelleria Torre Annunziata"** - Volume: ~50/mese
3. **"cartoleria Napoli"** - Volume: ~500/mese
4. **"cartoleria bambù"** - Brand keyword

### Prodotto (Priorità Alta)

1. **"quaderni online"** - Volume: ~1000/mese
2. **"penne online"** - Volume: ~800/mese
3. **"cancelleria online"** - Volume: ~2000/mese
4. **"materiale scolastico online"** - Volume: ~1500/mese

### Long-tail (Priorità Media)

1. **"dove comprare quaderni Torre Annunziata"**
2. **"cartoleria aperta domenica Napoli"**
3. **"forniture ufficio Torre Annunziata"**
4. **"cancelleria bambini online"**

---

## 📍 LOCAL SEO SETUP

### Google My Business

- [ ] **Nome**: "Cartoleria Bambù"
- [ ] **Indirizzo**: "Corso Umberto I, 367, 80058 Torre Annunziata NA"
- [ ] **Telefono**: [Numero da aggiungere]
- [ ] **Sito web**: https://cartoleriabambu.com
- [ ] **Categoria**: Cartoleria, Negozio di articoli per ufficio
- [ ] **Orari**:
  - Lun-Ven: 7:15-13:30, 16:30-20:30
  - Sab: 7:30-13:30
  - Dom: 8:30-13:30
- [ ] **Descrizione**: "Cartoleria Bambù dal 2016 a Torre Annunziata. Quaderni, penne, cancelleria, giochi e materiale per ufficio. Anche online con consegna rapida."

### NAP Consistency (Nome, Indirizzo, Telefono)

Assicurarsi che questi dati siano IDENTICI ovunque:

- **Nome**: Cartoleria Bambù
- **Indirizzo**: Corso Umberto I, 367, 80058 Torre Annunziata (NA)
- **Telefono**: [Da definire]
- **Email**: Cartoleriabambu@icloud.com

---

## 🔧 MODIFICHE TECNICHE IMMEDIATE

### Layout.tsx Updates

```tsx
export const metadata = {
  title:
    "Cartoleria Bambù | Cancelleria Torre Annunziata | Quaderni Penne Online",
  description:
    "Cartoleria Bambù a Torre Annunziata dal 2016. Quaderni, penne, cancelleria online. Consegna rapida in Campania. ⭐ La tua cartoleria di fiducia.",
  keywords:
    "cartoleria Torre Annunziata, cancelleria online, quaderni, penne, materiale scolastico",
  openGraph: {
    title: "Cartoleria Bambù | La tua cartoleria di fiducia a Torre Annunziata",
    description:
      "Dal 2016 la migliore cartoleria di Torre Annunziata. Ora anche online!",
    url: "https://cartoleriabambu.com",
    siteName: "Cartoleria Bambù",
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cartoleria Bambù | Torre Annunziata",
    description: "La tua cartoleria di fiducia dal 2016",
  },
  alternates: {
    canonical: "https://cartoleriabambu.com",
  },
};
```

### Structured Data (Schema.org)

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Cartoleria Bambù",
  "image": "https://cartoleriabambu.com/bambu-logo.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Corso Umberto I, 367",
    "addressLocality": "Torre Annunziata",
    "addressRegion": "Campania",
    "postalCode": "80058",
    "addressCountry": "IT"
  },
  "url": "https://cartoleriabambu.com",
  "telephone": "[TELEFONO]",
  "email": "cartoleriabambu@icloud.com",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "07:15",
      "closes": "13:30"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "16:30",
      "closes": "20:30"
    }
  ]
}
```

---

## 📊 METRICHE DA TRACCIARE (BASELINE)

### Before SEO (Stato Attuale)

- [ ] **Organic Traffic**: 0 (nuovo sito)
- [ ] **Keywords Ranking**: Nessuna
- [ ] **Google My Business**: Non configurato
- [ ] **Page Speed**: [Da misurare]
- [ ] **Core Web Vitals**: [Da misurare]

### Target 30 Giorni

- [ ] **Organic Traffic**: 100+ visite/mese
- [ ] **Local Pack**: Apparire per "cartoleria Torre Annunziata"
- [ ] **Brand Searches**: 50+ ricerche "cartoleria bambù"
- [ ] **Page Speed**: >90 su mobile
- [ ] **Indexed Pages**: 100% delle pagine pubbliche

### Target 90 Giorni

- [ ] **Organic Traffic**: 500+ visite/mese
- [ ] **Top 3 Local**: "cartoleria Torre Annunziata"
- [ ] **10+ Keywords**: Top 10 su Google
- [ ] **Reviews**: 10+ recensioni Google
- [ ] **Conversions**: 2% conversion rate

---

## 🎯 CONTENT PRIORITIES

### Pagine da Ottimizzare (Ordine Priorità)

1. **Homepage** - Landing principale
2. **Chi Siamo** - Trust e local SEO
3. **Categorie Prodotti** - SEO per categorie
4. **Product Pages** - Long tail keywords
5. **Contatti** - Local SEO e NAP

### Content da Creare

1. **FAQ**: "Consegnate a Torre Annunziata?"
2. **Guide**: "Come scegliere il quaderno giusto"
3. **Blog**: "Novità cancelleria 2025"
4. **Pagina Servizi**: "Consegna rapida in Campania"

---

## 🚨 ERRORI DA EVITARE

1. **Keyword Stuffing**: Non ripetere troppo le keywords
2. **Duplicate Content**: Ogni pagina deve essere unica
3. **Missing Alt Text**: Tutte le immagini devono avere alt
4. **Slow Loading**: Page speed < 3 secondi
5. **Mixed NAP**: Indirizzo sempre identico
6. **No Mobile**: Tutto deve funzionare su mobile
7. **Broken Links**: Controllare link interni/esterni

---

## 🔥 QUICK WINS (Risultati Rapidi)

### Settimana 1

- ✅ Google My Business setup
- ✅ Metadata homepage
- ✅ Google Analytics setup
- ✅ Robots.txt

### Settimana 2

- ✅ Sitemap XML
- ✅ Search Console
- ✅ Alt text immagini
- ✅ Schema LocalBusiness

### Settimana 3

- ✅ Ottimizzazione Chi Siamo
- ✅ Internal linking
- ✅ Page speed audit
- ✅ Prime recensioni Google

### Settimana 4

- ✅ Content categorie
- ✅ Product descriptions
- ✅ Social sharing
- ✅ Monitoring setup

---

**🎯 FOCUS**: Locale prima di tutto! Torre Annunziata e Napoli sono il nostro mercato principale.
