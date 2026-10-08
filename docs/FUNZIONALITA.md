# Funzionalità: confronto con Cartoleria Varzi

Analisi di [cartoleriavarzi.com](https://cartoleriavarzi.com) (Shopify, tema Hyper) fatta l'8 ottobre 2026
e stato di ogni funzionalità sul nuovo sito Cartoleria Bambù.

Legenda: ✅ fatto · ⚙️ fatto, va attivato o configurato · 💬 da decidere con il negozio · ➖ non applicabile

## Header e navigazione
| Funzionalità Varzi | Bambù |
|---|---|
| Barra in alto con messaggio "spedizione gratuita da…" e social | ✅ Messaggi a rotazione modificabili dal pannello (Impostazioni → Barra messaggi), icone social, telefono |
| Selettore lingua IT/EN e valuta | ➖ Negozio locale, solo italiano/euro |
| Header fisso con account e carrello con contatore | ✅ Più icona Preferiti con contatore |
| Carrello laterale (drawer) | ✅ Con barra "ti mancano X € per la spedizione gratuita" e omaggio |
| Ricerca con suggerimenti istantanei (prodotti con prezzo, categorie, "vedi tutti i risultati") | ✅ Con ricerche frequenti, navigazione da tastiera, prezzi scontati |
| Mega-menu su 3 livelli | ✅ Generato dall'albero categorie, ordinabile dal pannello |
| Menu mobile a pannello con sottomenu e social | ✅ |

## Homepage
| Funzionalità Varzi | Bambù |
|---|---|
| Slideshow con banner e pulsanti | ✅ Banner modificabili dal pannello (titolo, testo, immagine, link, colore), autoplay |
| Griglia di 4 banner/vetrine | ✅ "Vetrine" modificabili dal pannello |
| Barra vantaggi (spedizione, pagamenti, assistenza, B2B) | ✅ Modificabile; il testo usa la soglia di spedizione reale (niente incoerenze 49 vs 49,90) |
| "Top 20 Best Sellers" | ✅ "I più venduti" calcolato dagli ordini reali |
| "La selezione di Mattia" (scelti dal titolare) | ✅ "La selezione di Bambù": basta segnare il prodotto "In evidenza" |
| Sezione immagine + testo | ✅ Sezione "Vieni a trovarci" con le foto vere del negozio, orari e indicazioni |
| Newsletter | ✅ Form con consenso privacy, iscritti esportabili in CSV |
| — | ✅ In più: caroselli "Offerte del momento" e "Novità", articoli del blog |

## Catalogo
| Funzionalità Varzi | Bambù |
|---|---|
| Briciole di pane, conteggio prodotti, titolo, testo SEO sotto la griglia | ✅ (il testo SEO è la descrizione della categoria) |
| Filtri: prezzo da/a, marca, chip dei filtri attivi, conteggi | ✅ Più "solo disponibili" e "solo in offerta"; pannello filtri a scomparsa su mobile |
| Filtri per colore/taglia delle varianti | 💬 Possibile in seguito, oggi le varianti hanno nomi liberi |
| Ordinamenti: in primo piano, best seller, A-Z, Z-A, prezzo ↑↓, data | ✅ Più "sconto maggiore" e "più pertinenti" nella ricerca |
| Paginazione numerata | ✅ Con link veri (indicizzabili) |
| Card con seconda immagine al passaggio del mouse | ✅ |
| Badge sconto con prezzo barrato | ✅ Badge "-20%", prezzo scontato in evidenza e prezzo pieno barrato (richiesta del negozio) |
| Prodotti esauriti visibili con badge "Esaurito" | ✅ In fondo alla lista |
| Aggiunta al carrello dalla lista | ✅ In più rispetto a Varzi (per i prodotti senza varianti) |

## Scheda prodotto
| Funzionalità Varzi | Bambù |
|---|---|
| URL con codice + nome del prodotto | ✅ `/product/72-nome-prodotto` (i vecchi link `/product/72` reindirizzano) |
| Galleria con miniature, colonna immagini fissa | ✅ Immagini aggiuntive e foto delle varianti |
| Marca, tipo, codice articolo | ✅ |
| Prezzo scontato con badge e prezzo barrato, "IVA inclusa" | ✅ Più "Risparmi X €" e scadenza dell'offerta |
| Varianti a pillole | ✅ Con miniatura dell'immagine della variante |
| Quantità + "Aggiungi al carrello", pulsante "Esaurito" | ✅ |
| Personalizzazione (es. nome da stampare) | ✅ Attivabile per prodotto, il testo arriva nell'ordine |
| Limite di acquisto per ordine | ✅ "Quantità massima per ordine" per prodotto |
| Stima di consegna (ordinato → spedito → consegnato) | ✅ Con festività e orario limite |
| "Vai di fretta? Ritira in negozio" | ✅ |
| Accordion spedizioni/resi/informazioni | ✅ |
| Icone di fiducia e pagamenti | ✅ |
| Condivisione Facebook, X, Pinterest | ✅ WhatsApp, Facebook, Pinterest, copia link |
| Prodotti correlati e "potrebbe piacerti anche" | ✅ Più "visti di recente" |
| Barra "Aggiungi" fissa in basso | ✅ Su mobile |
| "Avvisami quando torna disponibile" (su Varzi disattivato) | ✅ Attivo: email automatica quando il prodotto torna disponibile |
| Recensioni (assenti su Varzi) | ✅ In più, con approvazione dal pannello |
| Lista desideri (assente su Varzi) | ✅ In più, anche per gli ospiti |

## Carrello e checkout
| Funzionalità Varzi | Bambù |
|---|---|
| Barra di avanzamento spedizione gratuita | ✅ |
| Nota all'ordine | ✅ |
| Codice sconto | ✅ Nel carrello e al checkout, gestione codici dal pannello |
| Omaggio sopra una soglia (app Free Gift) | ⚙️ Pronto: si attiva da Impostazioni → Omaggio |
| Prodotti visti di recente nel carrello vuoto | ✅ |
| Stimatore spese di spedizione | ✅ Spese calcolate subito nel riepilogo (tariffa unica Italia) |
| Ritiro in negozio | ✅ |
| Consegna in giornata con corriere proprio (Napoli) | ⚙️ Pronto: si attiva da Impostazioni (CAP abilitati, orario limite, costo) |
| Contrassegno con commissione | ⚙️ Pronto: si attiva da Impostazioni → Pagamenti (escluso per prodotti personalizzati, come Varzi) |
| Carte, Apple Pay, Google Pay | ✅ Tramite Stripe |
| PayPal, Klarna | ⚙️ Il codice è pronto: si abilitano dalla dashboard Stripe (Impostazioni → Metodi di pagamento) |
| Richiesta fattura (dati fiscali) | ✅ Ragione sociale, P.IVA, codice fiscale, SDI, PEC |
| Messaggi promozionali Klarna in scheda prodotto | 💬 Richiede l'attivazione di Klarna |

## Account cliente
| Funzionalità Varzi | Bambù |
|---|---|
| Ordini, profilo | ✅ Area "Il mio account" con ordini, stato, tracking, annullamento entro 24 ore |
| Accesso senza password con codice via email | 💬 Oggi email + password (con recupero password) |
| Registrazione rivenditori B2B | ✅ Pagina e modulo dedicati; le richieste arrivano nel pannello |
| Prezzi riservati B2B | 💬 Da decidere (listini per cliente) |

## Marketing e promozioni
| Funzionalità Varzi | Bambù |
|---|---|
| Newsletter + popup | ✅ Popup attivabile dal pannello |
| Collezioni promozionali | ✅ Pagina Offerte, Novità, selezione in evidenza |
| Gift card | 💬 Da decidere: implicazioni fiscali (buoni multiuso) |
| Tema stagionale e conto alla rovescia | ✅ Conto alla rovescia attivabile dal pannello (es. rientro a scuola) |
| Gioco "caccia alla zucca" | ➖ Disattivato anche su Varzi |
| Prenotazioni (preorder) | 💬 |

## Contenuti e informazioni
| Funzionalità Varzi | Bambù |
|---|---|
| Chi siamo | ✅ Con le foto del negozio |
| I nostri negozi (indirizzo, orari, telefono) | ✅ In Contatti, con mappa |
| FAQ ad accordion | ✅ Domande modificabili dal pannello, dati strutturati per Google |
| Contatti con modulo | ✅ |
| Richiesta preventivo (allestimenti) | ✅ Adattato: "Ordini per scuole, uffici e associazioni" |
| Blog | ✅ Articoli scritti dal pannello |
| Mappa del sito HTML | ✅ |
| Recesso online in 3 passaggi | ✅ Con email di conferma (data e ora) al cliente. È la "funzione di recesso" richiesta dalla Direttiva UE 2023/2673, applicabile dal 19/06/2026: da far verificare al consulente legale |
| Bolla chat WhatsApp | ✅ |
| Banner cookie | ✅ Iubenda (già in uso) |

## SEO e tecnica
| Funzionalità Varzi | Bambù |
|---|---|
| Dati strutturati (Organization, LocalBusiness, BreadcrumbList, ItemList, Product con Offer) | ✅ Più WebSite/SearchAction, FAQPage, spedizione e politica di reso nel Product |
| Titoli e descrizioni automatici | ✅ |
| Canonical, Open Graph | ✅ |
| Sitemap con prodotti e immagini | ✅ `/sitemap.xml` generata automaticamente |
| Feed Google Merchant Center | ✅ `/feed/google` |
| Meta Pixel / TikTok Pixel | ⚙️ Meta Pixel pronto: basta impostare `NEXT_PUBLIC_META_PIXEL_ID` (si attiva solo col consenso cookie) |

## Difetti di Varzi che non abbiamo copiato
- Errore di template visibile in ogni pagina, stringhe non tradotte.
- "Reso gratuito" in homepage in contrasto con la policy.
- Soglia di spedizione incoerente (49 € in un punto, 49,90 € in un altro): su Bambù tutti i testi leggono la stessa impostazione.
