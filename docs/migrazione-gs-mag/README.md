# Migrazione del gestionale libri GS_MAG in Bambù

Questa cartella raccoglie l'inventario del gestionale dei libri scolastici che la cartoleria usa oggi (GS_MAG, «GESTIONE MAGAZZINO»). Serve a portare tutte le funzioni e i dati nel pannello di Bambù **as is**, cioè senza cambiare il modo di lavorare.

L'inventario è ricavato dal programma decompilato (`MIK.rar`, build del 15 set 2023), con riferimenti `file:riga` al sorgente decompilato. I dettagli sono in un file per sezione:

| File | Sezione |
|---|---|
| [scuole.md](scuole.md) | SCUOLE: liste adozioni per classe e import dal Ministero |
| [clienti.md](clienti.md) | CLIENTI: prenotazioni dei libri delle famiglie |
| [ordini.md](ordini.md) | ORDINI: ordini al distributore |
| [bolle.md](bolle.md) | BOLLE: **arrivo merce** dal fornitore, con lettore barcode |
| [magazzino-menu-lib.md](magazzino-menu-lib.md) | MAGAZZINO, menu, motore comune dei form, elenco tabelle, report |

## Il programma in breve

Il programma è un WinForms .NET 4.6 fatto su misura nel 2016. Usa i controlli Syncfusion e 6 report Crystal. I dati stanno in un SQL Server Express, database `MIKE`, raggiunto via VPN Hamachi. Le credenziali di amministratore sono scritte in chiaro nell'eseguibile, quindi **vanno cambiate** a migrazione fatta.

Il flusso di un libro, dalla lista della scuola alla consegna:

```
SCUOLE   lista adozioni della classe (import da dati.istruzione.it, solo Campania)
   │  «Importa» copia la lista nella scheda del cliente
CLIENTI  scheda famiglia: libro per libro  confermato → (ordinato) → (arrivato) → consegnato
   │  «Importa» prende i confermati non ancora ordinati (vista Codici_Da_Ordinare_View)
ORDINI   ordine al distributore, una riga per copia; marca ordinato sulla prenotazione; export CSV codice;quantità
   │
BOLLE    arrivo merce: si legge l'ISBN, va al primo cliente che ha confermato → arrivato,
   │     +1 al magazzino «prenotato»; se nessuno l'aspetta va a scaffale («locale»); etichetta barcode
CLIENTI  «Consegna»: consegnato, −1 dal prenotato  (oppure «Consegna da magazzino»: −1 dal locale)
MAGAZZINO  una riga per ISBN con contatori di carico/scarico prenotato e locale, più rettifiche manuali
```

Numerazioni: scheda cliente, ordine e bolla ripartono ogni «anno». L'anno però è quello solare, non quello scolastico. Il barcode è anno + numero su 9 cifre.

## Cosa vuol dire «as is» qui

Ricopiamo tutto ciò che il negozio usa davvero: schermate, campi, stati, numerazioni, barcode, stampe ed export CSV. Non ricopiamo i difetti che rovinano i dati. Negli inventari sono elencati alla sezione «Stranezze», quelli che contano sono:

- nessuna transazione e tutti gli errori SQL ignorati in silenzio;
- query costruite concatenando il testo, quindi un titolo con l'apostrofo fallisce;
- contatori di magazzino non simmetrici («Rimuovi consegna» in Clienti, storni in Bolle), quindi le giacenze attuali potrebbero essere già sfasate;
- caselle legate alla colonna sbagliata («Arrivato» mostra `cons`), filtri AND/OR senza parentesi, import con doppio click che non funziona;
- doppioni non controllati (stesso ISBN in Magazzino, schede ripetute);
- codice morto da non portare: Magento/itsystemshop, Excel, `elca_articoli`, `ITSYS_*`, schede anagrafiche fornitore nascoste, import da CSV locali.

## Proposta di modello in Bambù (da confermare sul DB vero)

Usiamo modelli Prisma nuovi, con migrazione additiva, nomi in italiano e un prefisso che li separi dall'e-commerce (`Order` esiste già):

- `LibroScolastico`: catalogo per ISBN (titolo, autori, volume, editore, materia, prezzo, flag ministeriali). Ha un legame facoltativo a `Product` per vendere lo stesso libro anche online.
- `Scuola` e `ListaAdozioni` + `ListaAdozioniRiga`: corrispondono a `Schede_Testata`/`Schede_Dettaglio`.
- `PrenotazioneLibri` + `PrenotazioneLibriRiga`: corrispondono a `Cliente_*`, con lo stato della riga (`DA_CONFERMARE`, `CONFERMATO`, `ORDINATO`, `ARRIVATO`, `CONSEGNATO`) e le sue date. Un legame facoltativo a `User` permette in futuro la prenotazione online.
- `OrdineFornitore` + righe: corrispondono a `Ordine_*`.
- `ArrivoMerce` + righe: corrispondono a `Bolla_*`.
- `MovimentoMagazzinoLibri`: un registro dei movimenti (carico/scarico, prenotato/locale, causale, utente). Le giacenze si **calcolano** dal registro invece di affidarsi a quattro contatori. La schermata Magazzino mostra le stesse colonne di oggi.

Le schermate vanno in **`/scuole`** (decisione del 30 ott 2026, vedi sotto), con le stesse sezioni del menu attuale: Magazzino, Bolle, Ordini, Clienti, Scuole.

## Decisioni (29 ott 2026)

- **Versione di riferimento**: questa build (15 set 2023) è quella da replicare. La data di blocco del 1/1/2025 non si porta.
- **Database `MIKE`**: non si ripristina e i dati non si importano. Bambù parte da zero; il DB resta solo un esempio per capire forma e contenuto dei dati.

## Cosa serve dal negozio

1. **Stampe d'esempio** (PDF o foto) dei 6 report: `Mike_Cliente`, `Mike_Bolle_Clienti`, `Mike_Bolle_BarCode` (etichetta), `Mike_Ordini_DaOrdinare`, `Mike_Ordini_Ordinati_Ordinati`, `Mike_Ordini_Ordinati_Arrivati`. In alternativa, Crystal Reports installato per aprire i `.rpt`, che sono in formato proprietario e non si leggono.
2. **Il formato che il distributore vuole per il CSV dell'ordine.**

## Domande per il negoziante (riassunto)

Le domande complete sono alla fine di ogni inventario. Queste decidono il modello:

1. **Anno**: la numerazione e le schede vanno per anno scolastico (es. 2026/27, da settembre) o per anno solare come fa oggi il programma?
2. **Flag New / Acq. / Cons**: vengono dalla lista ministeriale (nuova adozione, da acquistare, consigliato)? Cambiano cosa si prenota o il totale?
3. **Prenotazione**: cosa vuol dire «confermato» (il cliente ha detto sì, oppure ha pagato l'acconto)? Ci sono sconti, cedole librarie, pagamenti dopo l'acconto?
4. **Una riga = una copia** ovunque: va bene così o servono le quantità?
5. **Assegnazione all'arrivo**: va sempre al primo cliente che ha confermato?
6. **Fornitori**: un ordine unico al distributore o uno per editore? Serve un'anagrafica fornitori?
7. **Magazzino**: cosa intendete per «prenotato» e per «locale»? Ci sono vendite al banco, rese a fine stagione, inventari? Le giacenze di oggi sono affidabili o vanno ricalcolate?
8. **Postazioni e utenti**: quante postazioni lavorano insieme e quante persone? Oggi l'utente registrato è sempre «gigisoft».
9. **Codice fiscale del cliente**: è obbligatorio? Come si distinguono due fratelli?
10. **Import dal Ministero**: lo fate ogni anno con «Importa OnLine»? Solo scuole della Campania, solo statali?

## Risposte del negozio (29 ott 2026)

Arrivate per scritto, con 5 vocali (trascritti con Whisper) e un foglio a mano.

1. **Anno solare**, come oggi: numerazione di schede, ordini e bolle per anno solare.
2. **Flag ministeriali**: le colonne «Acq.» e «Cons» non sono affidabili e il negozio **non le usa**. Conta solo **New**: libro nuovo, che non si trova usato. Le altre due si mostrano come arrivano dal Ministero e non cambiano nulla.
3. **Confermato** = il cliente l'ha ordinato. **Nessuno sconto** e nessuna cedola. C'è solo l'**acconto**, che si deve poter **aggiornare** in seguito.
4. **Una riga = una copia** resta così. Se una famiglia vuole due copie dello stesso libro, il negozio crea un'altra scheda.
5. **Assegnazione all'arrivo**: sempre al primo che ha confermato.
6. **Fornitori**: un solo fornitore. Il negozio genera il CSV dei libri da ordinare. Dopo un mese deve poter **stampare e ri-esportare tutti i libri ancora in ordine**, sia per controllare che i conti tornino sia per ordinarli altrove. Non serve un'anagrafica fornitori.
7. **Magazzino** (risposta del 30 ott 2026):
   - Negli ordini si aggiungono a mano libri senza cliente, **sempre una copia per riga**.
   - Un libro prenotato è ordinato per quel cliente, punto.
   - La giacenza va legata alla scheda del cliente quando si prenota: **se il libro è in negozio glielo si dà subito**.
   - Serve una **cartella dei libri già disponibili**, caricata in anticipo, da tenere sotto controllo e correggere a mano.
   - Su vendite al banco, rese e inventari *non ha detto nulla*.
8. **Postazioni**: 3 computer, a volte usati tutti insieme, **tutti con lo stesso account**. Non serve sapere chi ha fatto cosa: niente utenti separati né registro per persona.
9. **Codice fiscale**: non obbligatorio, non lo mettono mai. Su come distinguono due fratelli *non hanno risposto*: basta il nome dell'alunno sulla scheda.
10. **Import dal Ministero**: sì, ogni anno con «Importa OnLine», solo Campania e solo scuole statali.
11. **Classe e corso**: classe e sezione scritte attaccate («1A»), come le carica il Ministero.

### Richieste in più (foglio a mano)

- Stampare l'**elenco di tutti i libri ancora in ordine**, cioè ordinati e non ancora arrivati: è la stessa richiesta del punto 6. Sul foglio la riga «libri non ancora arrivati» è cancellata perché coincide con questa.
- Stampare la **lista intera dell'alunno**: tutti i libri della classe, anche quelli che non ha ordinato.
- **Fare la fattura facilmente.** Da chiarire: fattura elettronica (SdI) o ricevuta/documento da stampare? Oggi GS_MAG non fa fatture.
- Aprire **scuola e classe da un menu a tendina**.
- **Annullare facilmente** un libro che era in ordine.

### Ancora aperto

- Magazzino: vendite al banco, rese e inventari (il resto della domanda 7 ha risposta).
- Quante persone usano il programma e se serve sapere chi ha fatto cosa.
- Che cosa intendono per fattura.
- Le stampe d'esempio dei 6 report e il formato CSV del distributore.

## Feedback del 29 ott sera e decisioni del 30 ott 2026

Due vocali dopo la prova di Scuole (trascritti con Whisper) più un messaggio a Francesco.

- **«Però ci siamo, ci siamo.»** La sezione Scuole va bene nella sostanza.
- **«È troppo piccolo, [deve occupare] tutto lo schermo»** → il gestionale ora occupa tutta la larghezza, con testi e righe più grandi.
- **«Si può fare un passaggio più semplice, perché ogni volta mi fa conferma, conferma»** → tolte le conferme dove non servono:
  - «Nuova scuola»: si scrive il codice e si preme Invio. In un colpo arrivano l'anagrafica, il salvataggio e tutte le classi dell'anno coi libri. Prima erano quattro passaggi. Se la scuola è già in elenco, la apre.
  - «Importa tutte le classi»: niente conferma, perché non tocca classi e libri già presenti.
  - Eliminare un libro: niente conferma. La riga sparisce e per 5 secondi c'è «Annulla».
  - Restano le conferme solo per eliminare una classe intera o una scuola.
- **Gestionale separato dall'e-commerce**: sta su `/scuole`, con un **account suo** (ruolo `SCUOLE`) e dentro solo questo strumento. L'account del negozio non entra in `/scuole` e quello di `/scuole` non entra nel pannello. L'account si crea con `server/scripts/creaUtenteScuole.ts`.

### Stati del libro prenotato (dal messaggio del negozio)

> Il libro dopo averlo prenotato lo vado a confermare quando inoltro l'ordine; quando arrivano i libri il libro viene Assegnato e poi, con il cliente davanti al bancone, Ritirato.

I nomi del negozio corrispondono uno a uno ai cinque stati di GS_MAG. L'«Importa» porta nella scheda tutti i libri della classe, e la «lista intera dell'alunno» li stampa anche se non sono stati ordinati: per questo serve anche uno stato «in lista».

| Stato in Bambù | Quando | GS_MAG |
|---|---|---|
| *in lista* | il libro è nella lista della classe ma il cliente non l'ha prenotato | non confermato |
| **Prenotato** | il cliente lo vuole (risposta 3: «confermato = il cliente l'ha ordinato») | confermato |
| **Confermato** | si inoltra l'ordine al fornitore (lo imposta la sezione Ordini) | ordinato |
| **Assegnato** | arriva con la bolla e va al primo cliente in attesa (lo imposta la sezione Bolle) | arrivato |
| **Ritirato** | il cliente lo ritira al bancone | consegnato |

La sezione Ordini prende i libri **Prenotati**. «Da pagare» = prenotati e successivi − acconto. «Annullare un libro in ordine» (Confermato → non più voluto) si fa insieme alla sezione Ordini, perché il libro ordinato deve liberarsi per il cliente successivo.

### Gift card con lo scanner: analisi

**Lettore.** Un lettore di codici a barre USB o Bluetooth in modalità tastiera non ha bisogno di driver né di integrazioni. Scrive il codice nel campo selezionato e preme Invio, quindi funziona subito nel browser, come nelle Bolle di GS_MAG. Per i codici a barre classici basta un lettore 1D. Se le card hanno un **QR** serve un lettore 2D, che costa poco di più.

**Quali gift card? Cambia tutto.**
- **Gift card di Bambù**, cioè carte o tagliandi del negozio con un codice: le gestiamo noi. Serve una tabella delle card con codice, importo, saldo e movimenti. Si scansiona, si vede il saldo, si carica alla vendita e si scala all'uso. Volendo, la stessa card si può usare anche nel negozio online. È fattibile in pochi giorni.
- **Gift card di terzi**, vendute in cassa (Amazon, PlayStation, Google Play…): l'attivazione passa dalla rete del fornitore, col suo terminale o il suo portale e un contratto. Non si integra senza la loro API. In Bambù al massimo si registra la vendita.

**Fisco** (da verificare col commercialista): una gift card spendibile su più prodotti è un *buono multiuso*. L'IVA si paga quando la card viene usata, non quando si vende.

### Stampante termica per lo scontrino: analisi

- **Lo scontrino fiscale** (documento commerciale) in Italia lo emette solo il **registratore telematico (RT)**. Una stampante termica qualunque non può farlo.
  - Se il negozio ha un RT **con interfaccia di rete**, Bambù può mandargli lo scontrino in rete. Alcuni modelli Epson, per esempio, ricevono lo scontrino come XML via HTTP; Custom e RCH hanno protocolli loro. Ci serve **marca e modello** dell'RT.
  - C'è un limite tecnico: Bambù è in HTTPS e l'RT in rete locale di solito risponde in HTTP. Il browser blocca questa combinazione, quindi o l'RT supporta HTTPS o serve un piccolo programma ponte sul PC.
- **Una ricevuta non fiscale** si può stampare invece su qualsiasi termica da 80 mm installata in Windows: ricevuta di prenotazione con acconto, promemoria di ritiro, saldo della gift card. Si usa la stampa del browser con un layout da 80 mm. Con Chrome avviato in «stampa diretta» non compare nemmeno la finestra di stampa. Questo è facile e si può fare subito.

### Risposte del 30 ott 2026

- Gift card **di Bambù**, ma il supporto fisico non è ancora scelto.
- Lo scontrino è una **ricevuta non fiscale**.
- Il lettore di codici a barre forse non c'è: se manca si compra, basta che funzioni col sito.

Dalla chat WhatsApp con Alessandro (committente), 30 ott 2026: vuole lavorare **sempre dal computer**, con una **stampante termica piccola** che stampi **quanto resta sulla scheda** (il saldo). **I lettori di codici a barre USB li ha già: 3.**

### Acquisti consigliati

- **Lettore**: USB, *emulazione tastiera (HID)*, **2D**, così legge codici a barre e QR, anche dallo schermo di un telefono. Costa 30–60 €; un modello professionale (es. Zebra DS2208) costa sui 100 €. Non servono driver né app.
- **Stampante**: termica da **80 mm**, USB, con **taglierina automatica** e **driver Windows**. Una economica costa 60–90 €; una Epson TM-T20III costa sui 150–200 €. Stampa dal browser con un layout da 80 mm. Chrome con `--kiosk-printing` stampa senza la finestra di dialogo.
- **Gift card**: tessere in PVC formato carta di credito da una tipografia online, con **dati variabili** (un codice a barre diverso su ogni tessera). Bambù genera **codici casuali**, non in sequenza, e si manda alla tipografia il file CSV. L'importo non si stampa: la tessera vale 0 finché non si carica alla vendita, quindi una tessera rubata in bianco non vale niente e una grafica sola basta per ogni taglio. Per iniziare subito, Bambù può stampare il buono con il codice a barre direttamente sulla termica.
- I codici contengono **solo cifre**: qualsiasi lettore li scrive giusti anche con la tastiera italiana. Con lettere e simboli il layout può cambiare i caratteri.

### Domande nuove per il negozio

1. Le gift card sono **vostre** (di Bambù) o di **altri marchi**? Se vostre: le avete già stampate, con quale codice (a barre o QR), e si usano anche online?
2. Lo «scontrino» è quello **fiscale** o basta una **ricevuta** (prenotazione, acconto, ritiro)? Marca e modello del registratore di cassa? È collegato in rete?
3. Avete già un lettore di codici a barre? È quello usato oggi nelle Bolle?

## Stato

- **Scuole: fatta** (29 ott 2026, non committata; dal 30 ott su `/scuole` con account a parte, tutta larghezza e meno conferme). Modelli `Scuola`, `SchedaScuola`, `SchedaScuolaLibro` (migrazione `gestionale_libri_scuole`), rotte `/api/libri`, pagina `/scuole` con le tendine anno → scuola → classe. «Importa OnLine» prende l'anagrafica (`SCUANAGRAFESTAT`) e i libri (`ALTCAMPANIA`) di una classe o di **tutta la scuola in un colpo solo**; le classi mancanti si creano con il corso uguale all'indirizzo del Ministero.
- Cosa è cambiato rispetto a GS_MAG: le sezioni possono essere di più lettere («3ASA»), quindi la classe si divide in anno di corso + resto e non in anno + una lettera. Oggi l'anno di corso arriva come numero e i flag come «Si»/«No» (qualche volta sporchi, es. «Mo»). L'anagrafica della scuola sta in una tabella sola invece di essere ripetuta su ogni scheda.

- **Clienti: fatta** (30 ott 2026, non committata). Modelli `SchedaCliente` e `SchedaClienteLibro` con lo stato del libro (migrazione `gestionale_libri_clienti`), rotte `/api/libri/clienti`, pagina `/scuole/clienti`.
  - Nuova scheda: cognome, nome, telefono, scuola e classe dalle tendine, acconto. I libri della classe arrivano da soli, «in lista»; si spuntano quelli prenotati oppure «Prenota tutti». Un libro aggiunto a mano entra già prenotato.
  - Numero per anno solare assegnato al salvataggio con un lock di Postgres: tre postazioni insieme non prendono lo stesso numero (provato con 10 creazioni in parallelo). Barcode anno + numero su 9 cifre: scritto o letto con lo scanner nella ricerca, apre la scheda.
  - L'acconto si aggiorna direttamente nella scheda. Totali: lista della classe, prenotati, acconto, da pagare.
  - «Ritira» libro per libro o «Ritira gli assegnati», con «Annulla ritiro». Si modificano ed eliminano solo i libri non ancora ordinati; la scheda si elimina solo se nessun libro è ordinato.
  - Stampe dal browser su A4: «Stampa scheda» (solo i prenotati, come `Mike_Cliente.rpt`) e «Lista intera» (tutti i libri della classe). Layout provvisorio finché non arriva una stampa d'esempio.
  - Vocali del 30 ott (dopo il video): terza stampa **«Da acquistare»** con i soli libri che hanno «Acquistare» = Sì e il loro totale («a volte vogliono solo sapere quanto costano i libri che devono prendere»), quindi la colonna Acq. adesso serve. **Acconto anche alla fine**: si scrive nella scheda quando si vuole. **Appunti** sul cliente (prima si usava la casella del codice fiscale): casella nella scheda e nel modulo, non vanno in stampa.
  - Alessandro (WhatsApp, 30 ott): **la colonna Vol. deve restare**, perché da lì vede quale libro devono comprare. Ora è una colonna a sé, in grassetto, nella scheda e in tutte e tre le stampe.
  - Non ancora: «Consegna da magazzino» (aspetta la domanda 7 sul magazzino). «Annulla libro in ordine» è arrivato con Ordini.

- **Ordini: fatta** (30 ott 2026, non committata). Modelli `OrdineFornitore` e `OrdineRiga` (migrazione `gestionale_libri_ordini`), rotte `/api/libri/ordini`, pagina `/scuole/ordini` con tre viste.
  - **Da ordinare**: i libri prenotati non ancora ordinati, per codice, con la quantità. Sono tutti spuntati; si toglie la spunta a quelli da non ordinare adesso. «Crea l'ordine» = inoltro: i libri diventano **Confermato**. Un solo fornitore, quindi niente anagrafica: c'è una casella di appunti sull'ordine.
  - **Una riga = una copia**, legata al libro del cliente che la aspetta (in GS_MAG era `key_key_cliente_dettaglio`). Nell'ordine si vede per chi è ogni copia, con il link alla scheda.
  - **CSV** `codice;quantità` senza intestazione, come in GS_MAG. Ma si genera dalle righe **dell'ordine** e non dalla lista dei da ordinare, e il nome del file ha l'anno (`ordine-2026-002.csv`): in GS_MAG l'ordine 5 di un anno sovrascriveva l'ordine 5 dell'anno prima.
  - **Ancora in ordine**: tutte le copie ordinate e non arrivate, di tutti gli ordini, con stampa e CSV da rimandare (risposta 6).
  - **Annulla libro in ordine** (dalla scheda cliente, sul libro Confermato; il pulsante chiede «Sì, annulla» sul posto): il libro torna in lista e la copia va subito al primo cliente che ha prenotato lo stesso libro, che diventa Confermato. Se non c'è nessuno resta **libera** nell'ordine; il prossimo «Crea l'ordine» la assegna prima di ordinarne altre.
  - Togliere una copia dall'ordine (prima che arrivi) rimette il libro Prenotato, con «Annulla» per 5 secondi. Un ordine si elimina solo se non è arrivato niente.
  - Ordini e abbinamenti passano uno alla volta (lock di Postgres): due postazioni non mettono lo stesso libro in due ordini.
  - **Per il negozio** (3 nov 2026, risposta 7): in «Da ordinare» si leggono col lettore (o si scrivono) i libri senza cliente da ordinare, con il numero di copie; entrano nel prossimo «Crea l'ordine», una riga per copia, anche se nessun cliente ha prenotato niente. Restano su quel computer finché non si crea l'ordine. Dentro un ordine già fatto c'è «Aggiungi per il negozio» per quelle dimenticate. I dati arrivano dalle classi, dalle schede o dal Magazzino; un codice mai visto va prima aggiunto in Magazzino. Sono copie libere come quelle annullate: se nel frattempo qualcuno prenota lo stesso libro vanno a lui, altrimenti all'arrivo finiscono in Magazzino.
  - Le Bolle segneranno `arrivatoAt` sulla copia e il libro come Assegnato.

- **Magazzino: fatto** (3 nov 2026, non committato). Modelli `GiacenzaLibro` (una riga per codice, copie libere in negozio, mai sotto zero per vincolo del database) e `MovimentoGiacenza` (registro: carico, correzione a mano, dato al cliente, rimesso in negozio), campo `dalNegozioAt` sul libro del cliente. Migrazione `gestionale_libri_magazzino`, rotte `/api/libri/magazzino`, pagina `/scuole/magazzino`.
  - **Carico col lettore**: si legge il codice e si preme Invio, +1 copia. Un codice nuovo prende i dati dalle classi (o dalle schede dei clienti); se non c'è da nessuna parte si apre il modulo da compilare.
  - **Correzione a mano**: − e + nella tabella, oppure nel libro si scrive quante copie ci sono davvero (il registro tiene la differenza). Un libro si toglie dal magazzino solo a zero copie.
  - In tabella, per ogni libro: copie in negozio, prenotati in attesa, in ordine, da ritirare. Se un libro è in negozio e qualcuno lo aspetta, «Prenotati» è in evidenza.
  - **Dai dal negozio** (risposta 7) nella scheda del cliente, sui libri In lista, Prenotato o Confermato con copie in negozio: il libro diventa **Assegnato** e poi si ritira come gli altri. Se era Confermato, la copia in ordine passa al primo che aspetta lo stesso libro (come «Annulla ordine»), altrimenti resta libera. **Rimetti in negozio** lo annulla: la copia torna in negozio e il libro torna Prenotato.
  - In Ordini, «Da ordinare» mostra quante copie dello stesso libro ci sono già in negozio.
  - Stesso lock di Ordini: l'ultima copia non va a due clienti (provato con due postazioni insieme).
  - GS_MAG distingueva «prenotato» e «locale» con quattro contatori: qui «prenotato» sono le copie dei clienti (Assegnato nelle schede), «locale» la giacenza.

## Prossimi passi

1. Modello Prisma definitivo con le risposte sopra. Il magazzino resta provvisorio finché non arriva la risposta alla domanda 7.
2. Sezioni nel pannello, una alla volta, ciascuna confrontata col programma vecchio: Scuole → Clienti → Ordini → Bolle → Magazzino.
3. Periodo in parallelo, poi spegnimento di GS_MAG e cambio delle credenziali SQL.
4. **Gift card di Bambù e ricevute non fiscali** su termica da 80 mm, come nuova sezione di `/scuole`, solo in negozio (l'uso online viene dopo). Rimandata dal 30 ott 2026: si riprende dopo Clienti. Acquisti e domanda IVA per il commercialista sono più sopra.
