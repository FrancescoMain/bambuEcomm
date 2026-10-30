# Inventario funzionale: sezione BOLLE (GS_MAG_SCHEDE_BOLLA)

Sorgenti analizzati (decompilati ILSpy, percorsi relativi a `scratchpad/src/`):

- `GS_MAG_SCHEDE_BOLLA/GS_MAG/GS_MAG_SCHEDE_BOLLA.cs` (6283 righe; dalla riga 2602 in poi è `InitializeComponent`, cioè il layout) → abbreviato **B.cs**
- `GS_MAG_SCHEDE_BOLLA/GS_MAG/GS_MAG_SCHEDE_BOLLA_STAMPE.cs` (dialogo di scelta stampa) → **BS.cs**
- `GS_LIB/GS_LIB/GS_LIB_FORM_01.cs` (classe base del form, CRUD generico) → **F01.cs**
- `GS_LIB/GS_LIB/GS_LIB_Grid_00.cs` (griglia di dettaglio con pulsanti Aggiungi/Elimina/Registra) → **G00.cs**
- `GS_LIB/GS_LIB/GS_LIB_TextBox.cs` → **TB.cs**
- per i collegamenti: `GS_MAG_SCHEDE_CLIENTE/GS_MAG/GS_MAG_SCHEDE_CLIENTE.cs` (**CL.cs**), `GS_MAG_SCHEDE_ORDINE/GS_MAG/GS_MAG_SCHEDE_ORDINE.cs` (**OR.cs**), `GS_MAG/GS_MAG/GS_MAG_MENU.cs` (**MENU.cs**)

Convenzioni: **[CERTO]** = letto nel codice; **[DEDOTTO]** = ricavato da nomi/contesto, da confermare; **[DA VERIFICARE]** = dipende dallo schema DB o dal runtime, non ricavabile dal codice.

---

## 1. Scopo della sezione

**Attenzione: il nome inganna.** Nonostante il brief parli di "consegne ai clienti", il codice mostra che la scheda BOLLE è la **registrazione dell'arrivo merce (bolla/DDT di entrata del fornitore o distributore)**: ogni riga letta col lettore barcode marca come `arrivato='SI'` la riga d'ordine al fornitore (`Ordine_Dettaglio`) e la prenotazione del cliente (`Cliente_Dettaglio`), e carica il magazzino (`qta_prenotata_carico` o `qta_locale_carico`) [CERTO, B.cs:2011-2022, 2045, 2100]. La **consegna al cliente** (flag `consegnato`) **non si fa qui**: si fa dalla Scheda Cliente, che aggiorna anche `Bolla_Dettaglio.consegnato` [CERTO, CL.cs:2280-2366]; questa scheda si limita a leggerlo (colore riga, blocco eliminazione). La scheda stampa anche le etichette barcode da attaccare al libro arrivato, per abbinarlo al cliente che l'ha prenotato [DEDOTTO dal filtro del report, B.cs:2488-2498].

Si apre dal pulsante **"BOLLE"** del menu principale (MENU.cs:430-451, 713); il titolo della finestra è "SCHEDE BOLLE" (B.cs:665, 680).

---

## 2. Schermata

### 2.1 Meccanismo generale (GS_LIB)

- Il form eredita da `GS_LIB_FORM_01`. Ogni controllo `GS_LIB_*` ha le proprietà `GS_LIB_Colonna` (colonna DB) e `GS_LIB_Indice` ("CCTT" = connessione CC e dataset TT). `GS_LIB_Bind(..., "add", c, t)` collega via data binding ogni controllo con indice uguale al dataset indicato (F01.cs:2002 e segg.). Dataset usati: **0000 = `Bolla_Testata`** (testata), **0010 = `Bolla_Dettaglio`** (righe), **0011 = vista `Codici_Ordinati_Raggruppati_View`**, **0002 = dataset di appoggio per la ricerca del codice volume** (B.cs:690-694, 1400-1405, 1832-1837, 2353-2358).
- `GS_LIB_Tabella` sui controlli vale `"ordine_testata"` / `"ordine_dettaglio"` (residuo della copia dalla scheda Ordini, vedi §7): serve solo alla ricerca (Make_Sql).
- Salvataggio testata: `GS_LIB_Button_Registra` fa `DataAdapter.Update` con `OleDbCommandBuilder`; in inserimento scrive le colonne di audit `inserimento_*`/`modifica_*`, poi rilegge il record con `key_key = MAX(Key_Key)` (quindi **key_key è IDENTITY** lato SQL Server) (F01.cs:945-1100, in particolare 1063). In modifica controlla che il record esista ancora ("Record Cancellato da altro utente") e gestisce `DBConcurrencyException` ("Record Modificato da altro utente") (F01.cs:1022-1047).
- `GS_LIB_SetColonna(c,t,col,val)` accoda un valore da scrivere sulla riga al prossimo Registra; **aggiunge solo se la colonna non è già in coda** (F01.cs:1956-1962).
- `GS_LIB_Dbase_Calcola_Sql*` esegue SQL libero (ExecuteScalar) e **inghiotte qualsiasi eccezione** restituendo 0 / "" / data minima (F01.cs:2612-2680). Tutti gli UPDATE/INSERT "a mano" di questa scheda passano da lì: un errore SQL non viene mai segnalato.
- Alla prima apertura la testata viene caricata con `where Bolla_Testata.key_key < 0`, cioè **vuota**: l'utente deve usare Cerca/Applica o Nuovo (B.cs:692).

### 2.2 Barra strumenti (generica GS_LIB, F01.cs:5679-6021)

| Pulsante | Cosa fa in questa scheda |
|---|---|
| Primo / Preced. / Success. / Ultimo | Navigazione tra le bolle caricate (base, nessun override utile: B.cs:316-374). Ad ogni cambio record si ricarica la griglia righe (B.cs:703-727). |
| Prec. / Succ. (scheda) | Navigazione tra schede aperte (base). |
| **Nuovo** | Nuova bolla: data = adesso, anno = anno solare corrente, numero = max+1 per anno, fuoco su "N° Forn" (B.cs:386-399). |
| **Registra** | Valida e salva la testata; ricalcola il barcode della bolla (B.cs:733-789). |
| **Cerca** | Modalità ricerca: svuota i campi, rende modificabile "Numero" (B.cs:430-437; F01.cs:1113-1130). |
| **Applica** | Esegue la ricerca costruita dai campi compilati (F01.cs:1139-1156, Make_Sql 3700 e segg.) e rimette "Numero" in sola lettura (B.cs:467-474). |
| **Annulla** | Annulla immissione/ricerca; rimette "Numero" in sola lettura (B.cs:486-493). |
| **Elimina** | Elimina la bolla solo se non ha righe ("Esiste dettaglio / Impossibile Eliminare") con doppia conferma "CONFERMI ELIMINAZIONE ?" / "SICURO ?" (B.cs:804-817; F01.cs:1278-1345). |
| Refresh | Rilegge il record corrente dal DB (base, F01.cs:1366-1410). |
| **Stampa** | Apre il dialogo "Stampa Ordini" (sic) con un solo pulsante "Stampa" e "ANNULLA"; con "Stampa" lancia `Mike_Bolle_Clienti.rpt` filtrato sulla bolla corrente (B.cs:550-568; BS.cs:32-54, 146, 175, 186). |
| Duplica | Nessuna funzione (base vuota, F01.cs:1467-1470). |
| **Elenco** | Mostra la griglia elenco delle bolle caricate (B.cs:827-876). |
| CHIUDI | Chiude la scheda. |

### 2.3 Testata (tabPage_0) — dataset 0000 = `Bolla_Testata`

Abbinamento etichetta→controllo ricavato dalle coordinate del layout (stessa riga, etichetta a sinistra) [DEDOTTO, ma molto affidabile].

| Etichetta | Controllo | Colonna DB | Tipo probabile | Note |
|---|---|---|---|---|
| Numero | `gS_LIB_DoubleTextBox_ordine_progressivo` | `ordine_progressivo` | intero | Sola lettura (B.cs:3771), 0 decimali; calcolato su Nuovo; modificabile solo in Cerca. Label B.cs:3821, binding B.cs:3749-3750 |
| Data | `GS_LIB_DateTimePickerAdv_data` | `data` | datetime | **Sola lettura** (B.cs:5075): impostata a `DateTime.Now` su Nuovo, non modificabile. Label B.cs:5028, binding B.cs:5063 |
| Anno | `GS_LIB_DoubleTextBox_anno` | `anno_scolastico` | intero | Impostato all'anno **solare** di oggi (B.cs:391). Ricerca per "=" (B.cs:4994). Obbligatorio in immissione (B.cs:782-787). Label B.cs:5018 |
| Barcode | `gS_LIB_TextBox_ordine_barcode` | `ordine_progressivo_barcode` | varchar(50) | Sola lettura (B.cs:3635). = anno + numero a 9 cifre con zeri (es. 2026 e n. 15 → `2026000000015`), ricalcolato a ogni Registra (B.cs:738-741). Label B.cs:3604 |
| N° Forn | `gS_LIB_TextBox_ordine_fornitore_codice_fiscale` | `ordine_fornitore_codice_fiscale` | varchar(50) | **Obbligatorio** (msg "Inserire Codice Fiscale", B.cs:749-754). [DEDOTTO] contiene il numero della bolla del fornitore, nonostante il nome colonna. Label B.cs:3648 |
| Ragione Soc. | `gS_LIB_TextBox_ordine_fornitore_cognome` | `ordine_fornitore_cognome` | varchar(50) | **Obbligatorio** (msg "Inserire Codice Cognome", B.cs:755-760). [DEDOTTO] ragione sociale del fornitore. Label B.cs:3735 |
| Nominativo | `gS_LIB_TextBox_ordine_fornitore_nome` | `ordine_fornitore_nome` | varchar(50) | **Obbligatorio** (msg "Inserire Codice Nome", B.cs:761-766). Label B.cs:3691 |
| Totale | `gS_LIB_DoubleTextBox_totale` | `totale` | decimal/money | Somma dei `prezzo` delle righe (B.cs:1798-1807), salvato con `GS_LIB_FORM_01_Update_Dataset`. Label B.cs:3831 |
| (nascosto, 63×13 px) | `gS_LIB_DoubleTextBox_key_key` | `key_key` | int identity | Usato da `Importa` (B.cs:2315). B.cs:5107 |

Ordine del tasto Invio/Tab (proprietà `GS_LIB_Prossimo_Controllo`, gestita in TB.cs:691-718): Data → Anno → Barcode → N° Forn → Ragione Soc. → Nominativo → N° Forn (B.cs:3625-3799, 4992, 5065).

### 2.4 Griglia righe "GS_LIB_GRID_001" — dataset 0010 = `Bolla_Dettaglio`

Visibile solo quando c'è una bolla selezionata e non si è in immissione/ricerca (B.cs:709-725). Query: `SELECT ROW_NUMBER() OVER(ORDER BY codice_volume) AS Nr, Bolla_Dettaglio.* FROM Bolla_Dettaglio WHERE keykey_testata = <key_key testata> ORDER BY codice_volume asc` (B.cs:1485-1492). Griglia **non editabile in cella** (B.cs:1407); altezza riga 60, Ctrl+↑/↓ cambia l'altezza (G00.cs:261-284).

Colonne visibili (B.cs:1423-1444): **Nr** (30, colorata per stato), **Materia** (`materia_disiplina`), **Cod.Volume** (`codice_volume`), **Autori** (`autori`), **Titolo** (`titolo`), **Vol.** (`volume`), **Editore** (`editore`), **Prezzo** (`prezzo`, formato `#,##.000`), **New** (`nuova_adozione`), **Acq.** (`da_acquistare`), **Cons** (`cons`).
Colonne nascoste (larghezza 0, B.cs:1409-1422, 1445-1468): audit, `key_key`, `keykey_testata`, `anno_testata`, `codice_scuola_testata`, `classe_testata`, `data_testata`, `progressivo_testata`, `barcode`, `confermato`, `ordinato`, `arrivato`, `confermato_data`, `ordinato_data`, `arrivato_data`, `ordinato_numero`, `arrivato_numero`, `key_key_cliente_dettaglio`, `tipo`, `consegnato`, `consegnato_data`. (`key_key_ordine_dettaglio` non è configurata: resta visibile con l'intestazione di default [DEDOTTO].)

Colore della cella **Nr** (B.cs:1622-1796) e del pulsante di stato `cButton_state` (B.cs:1554-1584), con legenda che appare passando il mouse su "LEGENDA" (B.cs:2466-2475, testi B.cs:3253-3334):

| Condizione | Colore | Legenda |
|---|---|---|
| confermato=NO, ordinato=NO, arrivato=NO | azzurro polvere | Non Confermato |
| SI / NO / NO | giallo-arancio | Confermato |
| SI / SI / NO | rosso | Ordinato |
| SI / SI / SI | verde lime | Arrivato |
| consegnato=SI (prevale) | blu-ciano | Consegnato |

Selezionando una riga, l'etichetta `gradientLabel_info` mostra in una stringa unica: codice scuola, nominativo scuola, classe, CF cliente, cognome, nome, codice volume, ricavati con:
`select codice_scuola+…+nominativo_scuola+…+classe+…+cliente_codice_fiscale+…+cliente_cognome+…+cliente_nome+…+c.codice_volume from Cliente_Testata a, Cliente_Dettaglio b, Bolla_Dettaglio c where c.key_key_cliente_dettaglio=<k> and c.key_key=<riga> and a.key_key=b.keykey_testata and b.key_key=c.key_key_cliente_dettaglio` (B.cs:1523-1553).

**Pannello di immissione riga** (controlli dentro la griglia, dataset 0010; tutti senza etichetta, l'unico titolo è "Dettaglio Scheda Cliente", B.cs:3969):

| Controllo | Colonna | Comportamento |
|---|---|---|
| `GS_LIB_TextBox_codice_dett` | `codice_volume` | Campo dove spara il **lettore barcode** (ISBN). All'uscita (Leave) cerca il libro (§3.3). Invio → va a Materia (B.cs:4828) |
| `GS_LIB_TextBox_materia_dett` | `materia_disiplina` | **Entrando in questo campo scatta l'inserimento automatico** della riga (§3.3). Freccia giù allarga il campo a 300×100, freccia su lo ripristina (B.cs:2113-2130) |
| `GS_LIB_TextBox_autore_dett` | `autori` | idem allargamento (B.cs:2132-2161) |
| `GS_LIB_TextBox_titolo_dett` | `titolo` | idem (B.cs:2163-2192) |
| `GS_LIB_TextBox_volume_dett` | `volume` | |
| `GS_LIB_TextBox_editore_dett` | `editore` | idem allargamento (B.cs:2194-2223) |
| `GS_LIB_DoubleTextBox_prezzo_dett` | `prezzo` | obbligatorio ≠ 0 |
| `GS_LIB_TextBox_na_dett` | `nuova_adozione` | sola lettura; click alterna ""→NO→SI→NO (B.cs:2225-2239) |
| `GS_LIB_TextBox_acq_dett` | `da_acquistare` | idem (B.cs:2241-2255) |
| `GS_LIB_TextBox_cons_dett` | `cons` | idem (B.cs:2257-2271) |
| `GS_LIB_TextBox_confermato_dett`, `_ordinato_dett` | `confermato`, `ordinato` | sola lettura, minuscoli (21×18) |
| `GS_LIB_TextBox_arrivato_dett` | **bound a `cons`** (bug, B.cs:4348) | sola lettura; il valore scritto in `arrivato` arriva da SetColonna |
| date picker `confermato_data`, `ordinato_data`, `arrivato_data` | omonime | sola lettura |
| `GS_LIB_DoubleTextBox_ordinato_numero`, `_arrivato_numero` | omonime | |
| `GS_LIB_DoubleTextBox_scheda_key_key_cliente_dettaglio` | `key_key_cliente_dettaglio` | link alla prenotazione cliente |
| `GS_LIB_DoubleTextBox_scheda_key_key_ordine_dettaglio` | **bound a `key_key_cliente_dettaglio`** (bug, B.cs:4067) | il valore scritto in `key_key_ordine_dettaglio` arriva da SetColonna |
| `GS_LIB_TextBox_tipo_dett` | `tipo` | sola lettura: `importato` / `locale` / vuoto |
| `GS_LIB_DoubleTextBox_scheda_nr`, `_scheda_key_key`, `_scheda_key_key_testata` | `Nr`, `key_key`, `keykey_testata` | tecnici |
| checkbox **"abilita stampa"** (`checkBox_abilita_stampa`) | — | se spuntata, ad ogni arrivo da ordine stampa subito l'etichetta barcode. Default: non spuntata (B.cs:3918) |
| pulsante **"STAMPA"** (`CButton_stampa_baecode`) | — | ristampa l'etichetta barcode della riga selezionata (B.cs:2477-2486) |
| `cButton_state` | — | semaforo di stato della riga (visibile solo in modifica, B.cs:1503-1513) |

Pulsanti della griglia (G00.cs:199-238): **Aggiungi** (→ `Dettaglio_Nuovo`), **Elimina** (→ `Dettaglio_Elimina`), **Registra** (→ `Dettaglio_Registra`). Click singolo su una riga: pannello svuotato, solo Aggiungi attivo; **doppio click**: la riga viene caricata nel pannello, attivi Elimina/Registra (B.cs:1503-1513; F01.cs:4666-4688).

### 2.5 Griglia "codici ordinati" "GS_LIB_GRID_002" — dataset 0011

`SELECT ROW_NUMBER() OVER(ORDER BY codice_volume) AS Nr, Codici_Ordinati_Raggruppati_View.* FROM Codici_Ordinati_Raggruppati_View ORDER BY codice_volume` **senza filtro** (né per fornitore né per bolla) (B.cs:1832-1838, 1859-1866). Colonne: Nr, **Cod.Volume**, **Titolo**, **Quantita** (`#,##.000`), **Prezzo** (`#,##.000`) (B.cs:1841-1850). Non editabile. **Doppio click** su una riga → `Importa(codice_volume)` (B.cs:1875-1884), vedi §3.4. [DEDOTTO] la vista elenca i codici ordinati al fornitore e non ancora arrivati, raggruppati con la quantità: la definizione della vista non è nel codice [DA VERIFICARE sul DB].

### 2.6 Griglia "Elenco" (pulsante Elenco)

Mostra il dataset testata (B.cs:827-876). Intestazioni impostate: Data (`data`), "Tipo Scuola" (`tipo_scuola`), Classe (`classe`), Corso (`corso`), Anno (`anno_scolastico`), Nominativo (`nominativo_scuola`), Indirizzo (`indirizzo_scuola`), CAP (`cap_scuola`), Città (`citta_scuola`), Provincia (`provincia_scuola`), Totale (`totale`, valuta con separatori italiani); nascoste audit, `key_key`, `codice_scuola`. **Queste colonne scuola sono copiate dalla scheda Cliente/Ordine e non risultano in `Bolla_Testata`** dalle altre parti del codice; i campi davvero usati (numero, barcode, fornitore) non sono configurati [DA VERIFICARE: se le colonne mancano, Syncfusion restituisce null e l'Elenco va in errore].

### 2.7 Filtri / ricerca

Cerca → compilare i campi testata → Applica. Per i campi testo la condizione è `like 'valore%'`, per i numerici `>=`, per "Anno" `=` (F01.cs:3933-3975 e analoghi; proprietà `GS_LIB_Ricerca_Tipo` nel layout). Campo vuoto = nessun filtro; tutti vuoti = tutte le bolle (F01.cs:4333-4346). **Problema**: il prefisso usato è `GS_LIB_Tabella` = `ordine_testata` (es. `ordine_testata.ordine_fornitore_cognome like 'X%'`) mentre la query è su `Bolla_Testata` → con almeno un filtro la SELECT con ogni probabilità fallisce [DA VERIFICARE a runtime] (B.cs:3628, 3672, 3715, 3762, 3802, 4995, 5068).

### 2.8 Seconda scheda (tabPage_1) — codice morto

Campi Iban, Agenzia, Banca, Codice Fiscale, P.Iva, EMail 1-3, Cellul., Telefono, Provincia, CAP, Città, Indirizzo, Nome, Cognome: **nessuno è legato al DB** (`GS_LIB_Colonna = null`) — residuo di una scheda anagrafica (B.cs:5138-6187).

---

## 3. Flussi

### 3.1 Creazione bolla (testata)

1. Nuovo (F01.cs:916-930 → B.cs:386-399):
   - `data = DateTime.Now`; `anno_scolastico = data.Year` (anno solare);
   - `ordine_progressivo = (select max(ordine_progressivo) from Bolla_Testata where anno_scolastico = <anno>) + 1` (se non ci sono bolle: 0+1 = 1, perché l'errore/NULL torna 0);
   - fuoco su "N° Forn".
2. L'utente compila N° Forn, Ragione Soc., Nominativo.
3. Registra (F01.cs:945): `Registra_Controlla_Immissione` (anno obbligatorio, B.cs:779-789) → `Registra_Controlla` (calcolo barcode + 3 campi obbligatori, B.cs:733-777) → INSERT su `Bolla_Testata` con audit utente fisso `0 / "gigisoft"` (B.cs:671-672) → rilettura per `key_key = MAX`.
4. Dopo il salvataggio compaiono le griglie righe e codici ordinati.

Regole: numerazione **per `anno_scolastico`** che in realtà è l'anno solare della data di creazione; numero non modificabile dall'utente (solo in ricerca); niente controllo di unicità né lock (due postazioni possono prendere lo stesso numero).

### 3.2 Pannello riga: tre casi decisi all'uscita dal campo Codice

`GS_LIB_TextBox_codice_dett_Leave` (B.cs:2346-2464) viene eseguito solo se il pannello non contiene una riga esistente (`scheda_key_key` vuoto) e il codice non è vuoto. Imposta `flag_ricerca_cod_volume`:

**Caso "ok" — c'è un ordine al fornitore in attesa** (B.cs:2353-2387):
`SELECT Ordine_Dettaglio.* FROM Ordine_Dettaglio WHERE codice_volume='<cod>' and confermato='SI' and ordinato='SI' and arrivato='NO' or tipo='locale' ORDER BY confermato_data asc` → prende **la prima riga** (la più vecchia per data di conferma, quindi FIFO tra i clienti) e copia nel pannello: dati libro, `confermato`, `ordinato`, `arrivato` (← in realtà copia `ordinato`, bug B.cs:2380), `ordinato_numero`, `arrivato_numero`, `key_key_cliente_dettaglio`, `tipo`, e `key_key` dell'ordine in `key_key_ordine_dettaglio`. (Vedi §7 per il bug di precedenza AND/OR.)

**Caso "okk" — nessun ordine in attesa, ma il codice esiste in qualche prenotazione cliente** (B.cs:2389-2425):
`SELECT Cliente_Dettaglio.* WHERE codice_volume='<cod>'` → copia solo i dati libro dalla prima riga; imposta confermato=NO, ordinato=NO, arrivato=SI, date conferma/ordine nulle, `ordinato_numero=0`, `arrivato_numero=<numero bolla>`, `tipo='locale'`, nessun link a cliente/ordine. Cioè: **arrivo per il magazzino locale (fuori ordine)**.

**Caso "okkk" — codice trovato solo in `Magazzino` o sconosciuto** (B.cs:2427-2463):
se esiste in `Magazzino` copia i dati libro come nel caso okk (`tipo='locale'`); se non esiste da nessuna parte non tocca il pannello (l'utente compila a mano). Il flag diventa comunque "okkk".

### 3.3 Lettore barcode = inserimento automatico (casi ok/okk)

Sequenza reale: il lettore scrive l'ISBN nel campo Codice e invia Invio → il fuoco passa a Materia (B.cs:4828; TB.cs:708-717) → Leave di Codice (§3.2) → **Enter di Materia** (B.cs:1970-2105):

Caso **"ok"** (arrivo di un libro ordinato):
1. Validazione riga (`Dettaglio_Controlla_Nuovo` → B.cs:1046-1057, 1270-1285, 1287-1364): obbligatori codice, materia, autore, titolo, volume, editore, prezzo≠0, nuova adozione, acquistato (msg "Inserire acquistato si-no"), consegnato (msg "Inserire consegnato si-no" — ma è il campo `cons`). Nessun controllo duplicati (B.cs:1366-1373 è vuoto).
2. `update Ordine_Dettaglio set arrivato='SI', arrivato_data='<data bolla yyyyMMdd HH:mm:ss.fff>', arrivato_numero=<n. bolla> where codice_volume='<cod>' and key_key=<key ordine>` (B.cs:2011-2016).
3. `update Cliente_Dettaglio set arrivato='SI', arrivato_data=…, arrivato_numero=<n. bolla> where codice_volume='<cod>' and key_key=<key_key_cliente_dettaglio>` (B.cs:2017-2022).
4. Rilegge da `Ordine_Dettaglio` `ordinato_numero`, `ordinato_data`, `confermato_data` e li mette nel pannello (B.cs:2023-2039).
5. `Dettaglio_Nuovo` → INSERT in `Bolla_Dettaglio` (B.cs:1173-1230): `keykey_testata`, `anno_testata`, `data_testata`, `progressivo_testata`, `barcode` (= barcode della testata), tutti i dati libro e flag, `arrivato_data` = **data della bolla**, `key_key_cliente_dettaglio`, `tipo`, `key_key_ordine_dettaglio`. Poi ricarica la griglia, ricalcola il totale e salva la testata.
6. Se "abilita stampa" è spuntata: stampa diretta su stampante di `Mike_Bolle_BarCode.rpt` con `{Bolla_Dettaglio.key_key_cliente_dettaglio} = <k>` (B.cs:2041-2044, 2488-2498; F01.cs:2877-2880).
7. Magazzino, `carico_prenotato` (B.cs:2502-2529): se il codice esiste `update Magazzino set qta_prenotata_carico = qta_prenotata_carico + 1 where codice_volume=…`, altrimenti `insert into Magazzino (…, qta_prenotata_carico=1, altre 0) select … from Bolla_Dettaglio where codice_volume=… and key_key_cliente_dettaglio=<k>`.
8. Fuoco di nuovo su Codice con testo selezionato (pronto per la lettura successiva) e ricarica della griglia codici ordinati.

Caso **"okk"** (arrivo fuori ordine per il magazzino): validazione come sopra; nessun update su Ordine/Cliente; riga inserita con confermato=NO, ordinato=NO, arrivato=SI, `tipo='locale'`; `Aggiorna_Magazzino("carico_locale1")`: `qta_locale_carico + 1` o insert-select da `Bolla_Dettaglio where codice_volume=…` con `qta_locale_carico=1` (B.cs:2053-2101, 2530-2556). Niente stampa etichetta.

Caso **"okkk"**: entrando in Materia non succede nulla; l'utente completa i dati e preme **Aggiungi** della griglia → `Dettaglio_Nuovo_001` inserisce la riga e chiama `Aggiorna_Magazzino("carico_locale2")`: `qta_locale_carico + 1` oppure `insert into Magazzino … values ('<cod>','<materia>','<autori>','<titolo>','<volume>','<editore>',<prezzo con punto>,'<na>','<acq>','<cons>',0,0,1,0)` (B.cs:1221-1224, 2557-2590).

Regola implicita: **ogni riga = 1 copia** (le quantità di magazzino si muovono sempre di 1; il totale bolla è la somma dei prezzi, senza quantità).

### 3.4 Import da griglia "codici ordinati" (doppio click)

`Importa(cod_vol)` (B.cs:2277-2344):
1. `insert into Bolla_Dettaglio (…, key_key_cliente_dettaglio, tipo, key_key_ordine_dettaglio) select <key testata>, anno_testata, codice_scuola_testata, classe_testata, '<ora>', <n.bolla>, '<barcode>', <dati libro>, confermato, 'SI', arrivato, confermato_data, '<ora>', arrivato_data, <n.bolla>, arrivato_numero, key_key_cliente_dettaglio, 'importato', key_key from Ordine_Dettaglio where codice_volume='<cod>' and confermato='SI' and ordinato='NO' and arrivato='NO'`.
   Nota: per l'ordine delle colonne, `'SI'` finisce in **ordinato**, l'ora in **ordinato_data**, il n. bolla in **ordinato_numero**, e `arrivato` resta quello dell'ordine (NO).
2. `update Ordine_Dettaglio set arrivato='SI', arrivato_data='<DateTime.ToString()>', arrivato_numero=<n.bolla> where codice_volume='<cod>' and confermato='SI' and ordinato='SI' and arrivato='NO'`.
3. Ricarica griglia, ricalcola totale, Registra testata.

È una copia mal adattata dell'`Importa` della scheda Ordini (OR.cs:2167-2194). **La INSERT è con ogni probabilità sempre in errore** (manca uno spazio: `,key_key` + `from` → `key_keyfrom Ordine_Dettaglio`, B.cs:2330-2331), errore inghiottito; l'UPDATE invece funziona. Effetto probabile: gli ordini del codice vengono marcati arrivati **senza** righe di bolla, senza aggiornare `Cliente_Dettaglio` né `Magazzino` [DA VERIFICARE con i dati].

### 3.5 Modifica di una riga

Doppio click → pannello caricato → Registra (B.cs:969-983, 1014-1044): rifiutata se `tipo='importato'` ("Impossibile modificare / E' importato"), se `arrivato='SI'` ("E' arrivato"), `ordinato='SI'` o `confermato='SI'`. Poiché ogni riga creata in questa scheda ha `arrivato='SI'` (o `ordinato='SI'` se importata), **in pratica nessuna riga è modificabile**.

### 3.6 Eliminazione riga ("annulla" un arrivo)

Pulsante Elimina della griglia (G00.cs:224-238 → B.cs:994-1012, 1232-1251, 1083-1130):
1. Bloccata se `consegnato='SI'` ("Impossibile eliminare / E' consegnato").
2. Doppia conferma "CONFERMI ELIMINAZIONE ?" / "SICURO ?".
3. Se `tipo='importato'`: `update Ordine_Dettaglio set arrivato='NO', arrivato_data=null, arrivato_numero=null where codice_volume=… and key_key=<key_key_ordine_dettaglio>`; idem su `Cliente_Dettaglio` con `key_key=<key_key_cliente_dettaglio>`; `update Magazzino set qta_prenotata_carico = qta_prenotata_carico - 1`.
4. Se `tipo='locale'`: ripristina solo `Ordine_Dettaglio` (stesso update) e `qta_locale_carico - 1`.
5. Se `tipo` è altro/vuoto: nessun ripristino.
6. DELETE della riga, ricalcolo totale, salvataggio testata.

### 3.7 Eliminazione bolla

Possibile solo se non ha righe (B.cs:804-817). `Elimina_Prima` esegue comunque `delete Bolla_Dettaglio where keykey_testata=<key>` (B.cs:1132-1139; F01.cs:1270-1276), di fatto inutile.

### 3.8 Annulla (pulsante di barra)

Annulla immissione/ricerca senza effetti DB (B.cs:486-493). Non esiste un "annulla bolla" che storni gli arrivi: si stornano solo riga per riga (§3.6).

### 3.9 Consegna al cliente (fuori da questa scheda)

Dalla Scheda Cliente, pulsante consegnato su una riga con `arrivato='SI'` (CL.cs:2280-2366):
- consegna: `Ordine_Dettaglio` e `Bolla_Dettaglio` `set consegnato='SI', consegnato_data='<ora>' where key_key_cliente_dettaglio='<k>'`; `Magazzino.qta_prenotata_scarico + 1`;
- rimozione consegna: stesse tabelle a `NO`/null e **`qta_prenotata_carico + 1`** (CL.cs:2306; sembra un errore: ci si aspetterebbe `qta_prenotata_scarico - 1`; da segnalare a chi fa la sezione Clienti).
La Scheda Cliente mostra anche "N° Bolla <progressivo> <data>" leggendo `Bolla_Dettaglio` (CL.cs:1606-1611).

---

## 4. Tabelle DB toccate

Tipi **dedotti** (nessuno schema DDL nel materiale); i valori SI/NO sono stringhe `'SI'`/`'NO'`.

### 4.1 `Bolla_Testata` (lettura/scrittura)

| Colonna | Tipo probabile | Significato |
|---|---|---|
| `key_key` | int IDENTITY, PK | chiave |
| `data` | datetime | data/ora creazione bolla |
| `anno_scolastico` | int | anno solare della data (nome fuorviante) |
| `ordine_progressivo` | int/numeric | numero bolla, progressivo per anno |
| `ordine_progressivo_barcode` | varchar(50) | anno + numero a 9 cifre |
| `ordine_fornitore_codice_fiscale` | varchar(50) | "N° Forn" [DEDOTTO: n. bolla fornitore] |
| `ordine_fornitore_cognome` | varchar(50) | "Ragione Soc." fornitore |
| `ordine_fornitore_nome` | varchar(50) | "Nominativo" |
| `totale` | decimal/money | somma prezzi righe |
| `inserimento_data`, `inserimento_utente_key_key`, `inserimento_utente_nome`, `modifica_data`, `modifica_utente_key_key`, `modifica_utente_nome` | datetime / int(o varchar) / varchar | audit |
| (`tipo_scuola`, `classe`, `corso`, `nominativo_scuola`, `indirizzo_scuola`, `cap_scuola`, `citta_scuola`, `provincia_scuola`, `codice_scuola`) | ? | citate solo nell'Elenco [DA VERIFICARE se esistono] |

### 4.2 `Bolla_Dettaglio` (lettura/scrittura)

| Colonna | Tipo probabile | Significato |
|---|---|---|
| `key_key` | int IDENTITY, PK | |
| `keykey_testata` | int, FK → `Bolla_Testata.key_key` | |
| `anno_testata`, `data_testata`, `progressivo_testata`, `barcode` | int, datetime, int, varchar | copie denormalizzate della testata |
| `codice_scuola_testata`, `classe_testata` | varchar | valorizzate solo da `Importa` (copiate dall'ordine) |
| `materia_disiplina` (sic), `codice_volume`, `autori`, `titolo`, `volume`, `editore` | varchar | dati libro (codice = ISBN) |
| `prezzo` | decimal(…,3) | prezzo copertina |
| `nuova_adozione`, `da_acquistare`, `cons` | varchar 'SI'/'NO' | flag dell'adozione scolastica (copiati) |
| `confermato`, `ordinato`, `arrivato` | 'SI'/'NO' | stato (copiato dall'ordine; arrivato='SI') |
| `confermato_data`, `ordinato_data`, `arrivato_data` | datetime null | |
| `ordinato_numero`, `arrivato_numero` | int | n. ordine fornitore; n. bolla |
| `key_key_cliente_dettaglio` | int null, FK → `Cliente_Dettaglio.key_key` | prenotazione cliente soddisfatta |
| `key_key_ordine_dettaglio` | int null, FK → `Ordine_Dettaglio.key_key` | riga d'ordine fornitore evasa |
| `tipo` | varchar | `importato` (da prenotazione cliente) / `locale` (per magazzino) / vuoto |
| `consegnato`, `consegnato_data` | 'SI'/'NO', datetime | scritti dalla Scheda Cliente |
| audit `inserimento_*`, `modifica_*` | | |

### 4.3 `Ordine_Dettaglio` (lettura + UPDATE)

Lette/scritte: `key_key`, `codice_volume`, `confermato`, `ordinato`, `arrivato`, `confermato_data`, `ordinato_data`, `arrivato_data`, `ordinato_numero`, `arrivato_numero` (= n. bolla), `key_key_cliente_dettaglio`, `tipo`, dati libro, `anno_testata`, `codice_scuola_testata`, `classe_testata`; `consegnato`/`consegnato_data` (dalla Scheda Cliente).

### 4.4 `Cliente_Dettaglio` (lettura + UPDATE) e `Cliente_Testata` (lettura)

`Cliente_Dettaglio`: `key_key`, `keykey_testata` (FK → `Cliente_Testata`), `codice_volume`, dati libro, `arrivato`, `arrivato_data`, `arrivato_numero`.
`Cliente_Testata`: `key_key`, `codice_scuola`, `nominativo_scuola`, `classe`, `cliente_codice_fiscale`, `cliente_cognome`, `cliente_nome` (solo per l'etichetta info).

### 4.5 `Magazzino` (lettura + INSERT/UPDATE)

`codice_volume` (chiave logica, senza vincolo di unicità visibile), dati libro (`materia_disiplina`, `autori`, `titolo`, `volume`, `editore`, `prezzo`, `nuova_adozione`, `da_acquistare`, `cons`), `qta_prenotata_carico`, `qta_prenotata_scarico`, `qta_locale_carico`, `qta_locale_scarico` (contatori; [DEDOTTO] giacenza prenotata = carico − scarico, idem locale). Probabile `key_key`.

### 4.6 Vista `Codici_Ordinati_Raggruppati_View`

`codice_volume`, `titolo`, `quantita`, `prezzo`. Definizione non disponibile [DA VERIFICARE].

Relazioni: `Bolla_Testata 1—N Bolla_Dettaglio`; `Bolla_Dettaglio N—1 Ordine_Dettaglio` (key_key_ordine_dettaglio); `Bolla_Dettaglio N—1 Cliente_Dettaglio` (key_key_cliente_dettaglio); `Ordine_Dettaglio N—1 Cliente_Dettaglio`; `Magazzino` legato a tutto solo per `codice_volume`.

---

## 5. Stampe / export

Entrambi i `.rpt` (cartella `mik/x/MIK/BAMBU/`, anche in `mik/fc/` e in `file_corretti.rar`) sono in formato Crystal Reports con stream `Contents` compresso/codificato: `strings` e `strings -e l` restituiscono solo i nomi degli stream OLE (`Contents`, `QESession`, `ReportInfo`, `SummaryInformation`), nessun nome di campo, tabella o testo. Provati anche zlib/deflate e XOR a byte singolo: nessun risultato. Lo stesso vale per tutti gli altri `.rpt` del pacchetto. **I campi stampati non sono ricavabili senza aprirli con Crystal Reports** (o il runtime .NET di Crystal su Windows).

Cosa si sa dal codice (il filtro passato è una *SelectionFormula* Crystal, F01.cs:2866):

| Report | Quando | Filtro | Modalità |
|---|---|---|---|
| `Mike_Bolle_Clienti.rpt` | barra → Stampa → "Stampa" | `{Bolla_Dettaglio.keykey_testata} = <key bolla>` (B.cs:563-564) | anteprima nel viewer |
| `Mike_Bolle_BarCode.rpt` | arrivo da ordine con "abilita stampa", oppure pulsante "STAMPA" sulla riga | `{Bolla_Dettaglio.key_key_cliente_dettaglio} = <k>` (B.cs:2492-2493) | **stampa diretta**, 1 copia, stampante predefinita (F01.cs:2877-2880) |

[DEDOTTO] `Mike_Bolle_Clienti` = elenco delle righe della bolla con il cliente a cui è destinato ogni libro (nome "Clienti"); `Mike_Bolle_BarCode` = etichetta con il barcode (probabilmente `Bolla_Dettaglio.barcode` e/o il codice cliente) da attaccare al libro arrivato. Da confermare guardando una stampa reale.

Nessun export CSV/Excel in questa scheda.

---

## 6. Collegamenti con le altre sezioni

- **Ordini (fornitore)**: la bolla evade le righe `Ordine_Dettaglio` (confermato=SI, ordinato=SI, arrivato=NO) scrivendo `arrivato='SI'`, `arrivato_data`, `arrivato_numero` = numero bolla; l'eliminazione della riga di bolla le riporta a `arrivato='NO'`. La griglia "codici ordinati" mostra la vista sugli ordini. `tipo` (`importato`/`locale`) nasce nella scheda Ordini (OR.cs:1156, 1190, 2187).
- **Clienti**: la prenotazione `Cliente_Dettaglio` collegata diventa `arrivato='SI'` (con n. bolla); la consegna al cliente si registra nella Scheda Cliente e scrive `Bolla_Dettaglio.consegnato` (CL.cs:2280-2366); la Scheda Cliente mostra "N° Bolla …" (CL.cs:1606-1611). Le righe consegnate qui non si possono eliminare.
- **Magazzino**: ogni arrivo fa +1 su `qta_prenotata_carico` (libro per cliente) o `qta_locale_carico` (libro per scaffale), creando la scheda magazzino se manca; ogni eliminazione fa −1.
- **Scuole**: solo indirettamente (etichetta info con codice/nominativo scuola e classe del cliente; colonne `codice_scuola_testata`/`classe_testata` copiate in import; Elenco con colonne scuola probabilmente inesistenti).

---

## 7. Stranezze, bug, codice morto, valori cablati (da NON copiare o da chiarire)

**Bug con effetti sui dati**
1. **Precedenza AND/OR nella ricerca dell'ordine** (B.cs:2353): `codice_volume='X' and confermato='SI' and ordinato='SI' and arrivato='NO' or tipo='locale'` restituisce anche **qualsiasi riga `tipo='locale'` di qualunque codice e già arrivata**; poiché si prende la prima per `confermato_data`, sparando un codice senza ordini in attesa si possono caricare titolo/prezzo di **un altro libro** e marcare arrivata una riga d'ordine sbagliata. Nella migrazione: `codice_volume = X AND confermato AND ordinato AND NOT arrivato` (e decidere col negoziante come trattare gli ordini "locale").
2. **INSERT di `Importa` rotta** (B.cs:2330-2331, manca lo spazio prima di `from`) + filtri incoerenti tra INSERT (`ordinato='NO'`) e UPDATE (`ordinato='SI'`) + colonne sfasate (`'SI'` finisce in `ordinato`). Effetto probabile: ordini marcati arrivati senza righe di bolla. Non replicare; capire se il doppio click viene usato.
3. **Asimmetria magazzino**: un arrivo nel caso "ok" con ordine `tipo='locale'` fa `qta_prenotata_carico + 1` (B.cs:2045), ma l'eliminazione di una riga `locale` fa `qta_locale_carico − 1` (B.cs:1120). Inoltre l'eliminazione non storna nulla se `tipo` è vuoto (caso okkk con libro sconosciuto) e per le righe `locale` create nei casi okk/okkk l'update su `Ordine_Dettaglio` ha `key_key = ` vuoto → SQL in errore silenzioso.
4. **`Importa` decrementa ma non incrementa**: le righe `importato` all'eliminazione fanno `qta_prenotata_carico − 1`, ma `Importa` non ha mai fatto +1.
5. **Errori SQL inghiottiti ovunque** (F01.cs:2612-2680): update parziali (Ordine aggiornato, riga di bolla non inserita, ecc.) senza transazione né messaggio. Nella migrazione: una transazione per ogni "lettura barcode".
6. **SQL concatenato senza escape**: un titolo con apostrofo ("L'italiano…") fa fallire in silenzio l'INSERT in `Magazzino` del caso okkk (B.cs:2577-2588); codice volume digitato con apice rompe tutte le query.
7. **Campi del pannello non ripuliti**: `Dettaglio_Clear_Video` (B.cs:1599-1620) non azzera `tipo`, `key_key_cliente_dettaglio`, `key_key_ordine_dettaglio`, `ordinato_numero`, `arrivato_numero`; nel caso okkk con codice sconosciuto (B.cs:2463) questi valori **restano dalla lettura precedente** e vengono salvati sulla nuova riga.
8. `GS_LIB_TextBox_arrivato_dett` riceve il valore di `ordinato` (B.cs:2380) ed è legato alla colonna `cons` (B.cs:4348); `GS_LIB_DoubleTextBox_scheda_key_key_ordine_dettaglio` è legato a `key_key_cliente_dettaglio` (B.cs:4067). Funziona per caso grazie a SetColonna.
9. **Ricerca rotta**: prefisso `ordine_testata.` sulla query di `Bolla_Testata` (§2.7).
10. **Stampa con ANNULLA**: se nel dialogo si preme ANNULLA, `GS_LIB_File_Report` e il filtro restano quelli dell'ultima stampa (es. etichetta barcode) e la stampa parte lo stesso (B.cs:553-567).
11. Data in `Importa` scritta con `DateTime.ToString()` (formato locale, B.cs:2336) invece del formato `yyyyMMdd HH:mm:ss.fff`; millisecondi non riempiti a 3 cifre (B.cs:2008-2009).
12. `insert into Magazzino … select … from Bolla_Dettaglio where codice_volume=…` del caso okk non filtra per riga (B.cs:2544-2554): se esistono già più righe con quel codice crea più schede magazzino per lo stesso codice.
13. `Registra_Controlla_Immissione` controlla l'anno solo se `Record_Trovati > 0` (B.cs:782).
14. Numerazione `max+1` senza lock (doppioni con più postazioni); "anno_scolastico" = anno solare (una bolla del 2 gennaio cambia numerazione a metà anno scolastico).
15. Testo barcode: `"000000000".Substring(0, 9 - len)` va in eccezione con numeri di più di 9 cifre; se il controllo mostrasse separatori delle migliaia ("1.000") finirebbero nel barcode [DA VERIFICARE].
16. Messaggi copiati da altre schede: "Inserire Codice Fiscale/Codice Cognome/Codice Nome" per N° Forn/Ragione Soc./Nominativo; "Inserire consegnato si-no" per il campo `cons`; titolo dettaglio "Dettaglio Scheda Cliente"; dialogo stampa "Stampa Ordini".

**Codice morto / residui di copia**
- Seconda scheda anagrafica completamente scollegata (B.cs:5138-6187).
- Gestione `parametri_operazioni` "fornitori"/"articoli" nel Paint: imposta `caller_flag`/`caller_mem` mai usati (B.cs:620-661).
- Tre controlli nascosti nella griglia codici ordinati legati a `da_acquistare`, `nuova_adozione`, `prezzo` del dettaglio (B.cs:3474-3592).
- `GS_LIB_Controlla_Dettaglio_001` non controlla niente (B.cs:1366-1373); `RecordValueChanging/Changed`, `CurrentCellValidating`, `TableControl2_Click`, `gS_LIB_TextBox2_TextChanged`, `Immissione_Automatica`, vari override che chiamano solo la base.
- Stile Elenco su colonna `codice_volume` inesistente in testata (B.cs:890-913); colonne scuola nell'Elenco.
- Colori tema 2..5 tutti uguali nella griglia codici ordinati (B.cs:1940-1956).
- Modifica riga di fatto impossibile (§3.5).

**Valori cablati**
- Utente audit `0` / `"gigisoft"` (B.cs:671-672): nessun utente reale tracciato.
- Stringhe di stato `'SI'`/`'NO'`, `tipo` = `'importato'` / `'locale'`.
- Barcode = anno (4) + progressivo (9 cifre).
- Nomi report e cartella dell'eseguibile (F01.cs:2815); stampa diretta su stampante predefinita, 1 copia.
- Connessione al DB presa dal form padre (credenziali non riportate qui).

---

## 8. Domande aperte per il negoziante

1. La scheda "BOLLE" serve a registrare **l'arrivo dei libri dal distributore/fornitore** (non la consegna al cliente)? E "N° Forn" è il numero del DDT del fornitore?
2. Una bolla corrisponde sempre a **un solo fornitore/distributore**? Servono altri dati della bolla (data del DDT fornitore diversa da oggi, partita IVA, note)? Oggi la data è sempre "adesso" e non si può cambiare.
3. La numerazione delle bolle deve ripartire **per anno solare** (come oggi) o **per anno scolastico** (es. da settembre)?
4. Quando arriva un libro ordinato per più clienti, va assegnato **al cliente che ha confermato per primo** (come oggi) o con un altro criterio (scuola, classe, chi ha pagato l'acconto)?
5. Usa il **doppio click sulla griglia "codici ordinati"** per caricare in blocco? (Nel codice attuale sembra non funzionare.) Se sì, cosa si aspetta che succeda?
6. La stampa dell'**etichetta barcode** a ogni lettura (casella "abilita stampa") la usa? Cosa c'è sull'etichetta (nome cliente, classe, codice)? Può mostrarci una stampa di `Mike_Bolle_Clienti` e di `Mike_Bolle_BarCode`?
7. Arrivi "fuori ordine" (libri non ordinati da nessun cliente): finiscono a scaffale (magazzino locale)? Va bene che siano trattati automaticamente così?
8. Cosa significano esattamente i flag **New / Acq. / Cons** (`nuova_adozione`, `da_acquistare`, `cons`) e chi li decide (vengono dall'elenco adozioni della scuola)?
9. Un libro arriva in più copie nella stessa bolla: va bene una riga per copia (come oggi) o preferisce una riga con quantità?
10. Gli ordini al fornitore "per magazzino" (`tipo='locale'`): quando arrivano, devono andare nel prenotato o nel locale? (Oggi entrano nel prenotato e, se si elimina la riga, escono dal locale.)
11. Le righe di bolla si possono correggere (prezzo, titolo) dopo la lettura? Oggi di fatto no: si elimina e si rilegge.
12. Serve sapere **chi** ha registrato la bolla (oggi tutto risulta fatto da "gigisoft")?
13. La ricerca delle bolle: per cosa cerca di solito (numero, fornitore, data, codice libro)? Nel codice attuale la ricerca con filtri sembra non funzionare.
14. L'**Elenco** bolle mostra oggi colonne di scuola/classe: quali colonne le servono davvero (numero, data, fornitore, totale, n. righe)?
15. Il "Totale" della bolla è a prezzo di copertina: le serve anche il costo d'acquisto (sconto del distributore) per controllare la fattura?
