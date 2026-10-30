# Inventario GS_MAG — Magazzino, Menu/avvio, libreria comune GS_LIB

Sorgenti decompilati (ILSpy) in `src/`. Percorsi citati relativi a `src/`. Numeri di riga = file decompilato.
Legenda: **[FATTO]** = letto nel codice; **[IPOTESI]** = deduzione non verificabile dal solo codice (da confermare su DB o col negoziante).
Le credenziali del DB e del servizio Magento sono cablate nel codice: qui se ne indica solo la posizione, mai il valore.

Abbreviazioni: `IC` = indice connessione, `IT` = indice tabella/dataset (vedi §3). `FORM_01` = `GS_LIB/GS_LIB/GS_LIB_FORM_01.cs`, `MAG` = `GS_MAG_MAGAZZINO/GS_MAG/GS_MAG_MAGAZZINO.cs`, `MENU` = `GS_MAG/GS_MAG/GS_MAG_MENU.cs`, `BOLLA` = `GS_MAG_SCHEDE_BOLLA/GS_MAG/GS_MAG_SCHEDE_BOLLA.cs`, `CLIENTE` = `GS_MAG_SCHEDE_CLIENTE/GS_MAG/GS_MAG_SCHEDE_CLIENTE.cs`.

---

## 1. Magazzino

### 1.1 Scopo
Anagrafica di giacenza **per codice volume (ISBN)**: una riga della tabella `Magazzino` per libro, con dati bibliografici copiati dalle schede adozioni e sei contatori di quantità (carico/scarico "locale" e "prenotato"). La schermata serve a **consultare** e a fare **rettifiche manuali** della giacenza libera (locale). I movimenti veri nascono altrove: arrivi in Bolla (carichi) e consegne al cliente (scarichi) — vedi §1.5.

### 1.2 Schermata (`GS_MAG_MAGAZZINO`, eredita `GS_LIB_FORM_01`)
Inizializzazione `MAG:604-636`: titolo "Magazzino", tabella `Magazzino` su dataset `[0,0]`, `Select " Magazzino.* "`, `Where " where Magazzino.key_key < 0 "` (la scheda **si apre vuota**: bisogna usare Cerca→Applica), `Order by codice_volume asc`, chiave `key_key` (`MAG:625-629`). Utente di audit cablato: `aggiornamento_utente_nome = "gigisoft"`, `key_key = 0` (`MAG:606-607`).

Campi della pagina 1 (designer `MAG:2040-2990`; tutti `GS_LIB_Indice="0000"` ⇒ dataset `[0,0]`):

| Etichetta | Controllo | Colonna `Magazzino` | Tipo controllo | Ricerca | R/O | Riga |
|---|---|---|---|---|---|---|
| Codice Volume | GS_LIB_TextBox_codice_volume | `codice_volume` | testo | `>=` (= LIKE 'x%') | no | MAG:2861-2875 |
| Materia | GS_LIB_TextBox_materia_disiplina | `materia_disiplina` (sic, "disiplina") | testo | LIKE | no | MAG:2818-2832 |
| Autore | GS_LIB_TextBox_autori | `autori` | testo | LIKE | no | MAG:2904-2918 |
| Titolo | GS_LIB_TextBox_titolo | `titolo` | testo | LIKE | no | MAG:2775-2789 |
| Volume | GS_LIB_TextBox_volume | `volume` | testo | LIKE | no | MAG:2732-2746 |
| Editore | gS_LIB_TextBox_editore | `editore` | testo | LIKE | no | MAG:2540-2554 |
| Prezzo | GS_LIB_DoubleTextBox_prezzo | `prezzo` | numerico | `=` | no | MAG:2949-2964 |
| Nuovo | gS_LIB_TextBox_nuova_adozione | `nuova_adozione` | testo (SI/NO [IPOTESI]) | LIKE | no | MAG:2497-2511 |
| Acquistare | gS_LIB_TextBox_da_acquistare | `da_acquistare` | testo | LIKE | no | MAG:2454-2468 |
| Consigliato | gS_LIB_TextBox_cons | `cons` | testo | LIKE | no | MAG:2373-2387 |
| Qta Carico Prenotata | gS_LIB_DoubleTextBox2 | `qta_prenotata_carico` | num | `=` | sì | MAG:2289-2309 |
| Qta Scarico Prenotata | gS_LIB_DoubleTextBox3 | `qta_prenotata_scarico` | num | `=` | sì | MAG:2241-2261 |
| Qta Prenotata | gS_LIB_DoubleTextBox1 | `qta_prenotata` | num | `=` | sì | MAG:2337-2357 |
| Qta Carico Disponibile | gS_LIB_DoubleTextBox_qtacaricodisponibile | `qta_locale_carico` | num | `=` | sì | MAG:2143-2164 |
| Qta Scarico Disponibile | gS_LIB_DoubleTextBox_qtascaricodisponibile | `qta_locale_scarico` | num | `=` | sì | MAG:2094-2115 |
| Qta Disponibile | gS_LIB_DoubleTextBox_qtadisponibile | `qta_locale` | num | `=` | sì | MAG:2192-2213 |
| Incremento | gS_LIB_DoubleTextBox_qtarettifica | *(nessuna, non legato)* default "1,00" | num | — | no | MAG:2045-2070 |

Pulsanti di rettifica (CButton "+" / "−") accanto a carico e scarico disponibili: `MAG:1945-2033, 2422-2434`.

In più, ereditati dal motore: `key_key`, `inserimento_*`, `modifica_*` (pannello "Inf", §3.6).

**Griglia dettaglio `GS_LIB_GRID_001`** (titolo "Dettaglio Libri Scuola", `MAG:2581-2598`): configurata su `Schede_Dettaglio` dataset `[0,10]` con `where keykey_testata < 0` (`MAG:1180-1253`) ma `Visible=false` nel designer (`MAG:2586`), nascosta di nuovo a ogni cambio record (`MAG:646, 655`) e senza pulsanti (`MAG:635`). **[FATTO] È un residuo copiato dalla scheda Scuole, inutile qui.** Lo stesso vale per i 3 campi `scheda_nr/key_key/keykey_testata` legati a `[0,10]` (`MAG:2611-2719`).

**Pagina 2 (tab 1)**: contiene campi Cognome, Nome, Indirizzo, CAP, Città, Provincia, Telefono, Cellulare, EMail 1-3, P.Iva, Codice Fiscale, Banca, Agenzia, Iban, Tipologia, Numero, Data Accettazione (`MAG:3077-4020`), **tutti con `GS_LIB_Colonna = null`**: copia-incolla da un'anagrafica, non legati a nulla. Raggiungibile col pulsante "Succ." della scheda (`GS_LIB_Tabs_Numero = 1`, `MAG:610`). [FATTO] codice morto visibile.

**Elenco (griglia `GS_LIB_Grid_Elenco`)**: `GS_LIB_Elenco_Settings` (`MAG:873-921`) imposta intestazioni per colonne `data, tipo_scuola, codice_scuola, classe, corso, anno_scolastico, nominativo_scuola, indirizzo_scuola, cap_scuola, citta_scuola, provincia_scuola, totale` che **non esistono in `Magazzino`** (copia da Schede). [IPOTESI] il pulsante Elenco in questa scheda va in eccezione (indicizzatore colonne Syncfusion su nome assente) o non mostra intestazioni; da provare.

**Filtri**: nessun filtro dedicato; la ricerca è quella generica (Cerca → si scrivono i criteri negli stessi campi → Applica, §3.4).

### 1.3 Pulsanti e flussi
- **Toolbar generica** (Primo/Prec/Succ/Ultimo, Nuovo, Registra, Cerca, Applica, Annulla, Elimina, Refresh, Elenco, Chiudi): tutte le override in `MAG:243-537` chiamano solo `base` (nessuna logica propria), salvo:
  - **Stampa** disabilitata di fatto: per il dataset corrente ritorna `""` senza stampare (`MAG:496-503`). Il form `GS_MAG_MAGAZZINO_STAMPE` ("Stampa Ordini", 3 scelte) **non è mai istanziato** (nessun `new GS_MAG_MAGAZZINO_STAMPE` nel codice).
- **Validazioni su Registra** (`MAG:664-762` e `765-840`): obbligatori codice volume, materia, autore, titolo, volume, editore, prezzo, nuova adozione, da acquistare, consigliato (messaggi "Inserire …"). Univocità `codice_volume` controllata **solo in modifica** (`select count(*) from Magazzino where codice_volume = '…' and key_key <> …`, `MAG:748-759`), **non in inserimento** ⇒ con "Nuovo" si può creare un ISBN duplicato.
- **Rettifica manuale** (`MAG:1392-1430`), quantità = campo "Incremento":
  - `+` carico: se `carico ≥ scarico` e `incremento > 0` → `qta_locale_carico += inc`, `qta_locale = carico − scarico`, Registra (`MAG:1394-1398`).
  - `−` carico: se `carico ≠ 0`, `carico > scarico`, `inc > 0` → `carico −= inc`, ricalcolo, Registra (`MAG:1404-1408`). **Non verifica che `carico − inc ≥ scarico`** ⇒ disponibile può andare negativo.
  - `+` scarico: se `scarico < carico`, `inc > 0` → `scarico += inc`, ricalcolo, Registra (`MAG:1414-1418`). Non verifica `scarico + inc ≤ carico`.
  - `−` scarico: se `scarico ≠ 0`, `scarico ≤ carico`, `inc > 0` → `scarico −= inc`, ricalcolo, Registra (`MAG:1424-1428`).
  - Le rettifiche lavorano sui valori a video e salvano con il meccanismo generico (concorrenza ottimistica, §3.3): se nel frattempo una Bolla ha incrementato il contatore, il salvataggio fallisce con "Record Modificato da altro utente" e la scheda ricarica.

### 1.4 Regole di calcolo delle giacenze
Colonne (tutte numeriche, [IPOTESI] `float`/`decimal` dato l'uso di `DoubleTextBox` e `+ 1` in SQL):

| Colonna | Significato dedotto | Chi la scrive |
|---|---|---|
| `qta_prenotata_carico` | pezzi arrivati con bolla **a fronte di un ordine cliente** (prenotati) | BOLLA, CLIENTE |
| `qta_prenotata_scarico` | pezzi prenotati **consegnati** al cliente | CLIENTE |
| `qta_locale_carico` | pezzi arrivati **senza prenotazione** (scorta libera) + rettifiche manuali | BOLLA, MAG |
| `qta_locale_scarico` | pezzi di scorta libera consegnati ("Consegna da Magazzino") + rettifiche | CLIENTE, MAG |
| `qta_locale` | disponibile libero = `qta_locale_carico − qta_locale_scarico` | **solo** la schermata Magazzino (`MAG:1397,1407,1417,1427`) |
| `qta_prenotata` | [IPOTESI] `qta_prenotata_carico − qta_prenotata_scarico` | **nessun punto del codice la scrive** |

- **[FATTO]** Le procedure di Bolla/Cliente aggiornano solo i 4 contatori `*_carico/*_scarico`, mai `qta_locale` né `qta_prenotata`. Eppure `CLIENTE:1644-1649` legge `select qta_locale from Magazzino` per decidere se mostrare "Consegna da Magazzino N".
- **[IPOTESI forte]** `qta_locale` e `qta_prenotata` sono **colonne calcolate** in SQL Server (`AS carico − scarico`); altrimenti `qta_locale` sarebbe sempre vecchia dopo ogni bolla. Va verificato sullo schema (`sp_help Magazzino`). Se calcolate, il CommandBuilder della schermata le salta in UPDATE [IPOTESI].
- Le quantità si muovono **sempre di 1 pezzo** (`+ 1` / `- 1`) nei moduli Bolla e Cliente: ogni riga di bolla/cliente = 1 copia.
- Non esistono vincoli di non-negatività nel codice (né controlli prima delle `update`).

### 1.5 Tutti i punti che scrivono `Magazzino` (grep su tutti i progetti)

| # | File:riga | Evento utente | SQL / effetto |
|---|---|---|---|
| 1 | BOLLA:2509-2512 (in `Aggiorna_Magazzino("carico_prenotato")`, chiamato da BOLLA:2045) | Bolla: inserimento riga per codice trovato in `Ordine_Dettaglio` confermato+ordinato+non arrivato (flag "ok", entrata nel campo materia `BOLLA:1970`) | `update Magazzino set qta_prenotata_carico = qta_prenotata_carico + 1 where codice_volume = '…'` |
| 2 | BOLLA:2516-2527 (idem, ramo else) | come sopra ma ISBN assente in Magazzino | `insert into Magazzino (…, qta_prenotata_carico, qta_prenotata_scarico, qta_locale_carico, qta_locale_scarico) select …, 1,0,0,0 from Bolla_Dettaglio where codice_volume='…' and key_key_cliente_dettaglio = …` |
| 3 | BOLLA:2537-2540 (`"carico_locale1"`, da BOLLA:2100) | Bolla: codice trovato solo in `Cliente_Dettaglio` (flag "okk", tipo "locale") | `update … qta_locale_carico = qta_locale_carico + 1` |
| 4 | BOLLA:2544-2554 (idem, else) | come sopra, ISBN nuovo | `insert into Magazzino … select …, 0,0,1,0 from Bolla_Dettaglio where codice_volume = '…'` (**senza altro filtro**: se in `Bolla_Dettaglio` ci sono N righe con quel codice inserisce N righe duplicate in Magazzino) |
| 5 | BOLLA:2564-2568 (`"carico_locale2"`, da BOLLA:1223 in `Dettaglio_Nuovo_001`) | Bolla: codice trovato solo in Magazzino o sconosciuto (flag "okkk") | `update … qta_locale_carico + 1` |
| 6 | BOLLA:2573-2589 (idem, ISBN nuovo) | come sopra | `insert into Magazzino values (dati digitati a video, prezzo con ',' → '.', 0,0,1,0)` |
| 7 | BOLLA:1105-1107 (`Dettaglio_Elimina_001`, da BOLLA:1083) | Bolla: elimina riga di tipo "importato" | `update … qta_prenotata_carico = qta_prenotata_carico - 1` (+ riporta `arrivato='NO'` su `Ordine_Dettaglio` e `Cliente_Dettaglio`) |
| 8 | BOLLA:1120-1122 (idem) | Bolla: elimina riga di tipo "locale" | `update … qta_locale_carico = qta_locale_carico - 1` |
| 9 | CLIENTE:2357-2360 (`cButton_consegnato_ClickButtonArea`, CLIENTE:2280) | Cliente: "Consegna" di un libro arrivato | `update … qta_prenotata_scarico = qta_prenotata_scarico + 1` (+ `consegnato='SI'` su Ordine_Dettaglio e Bolla_Dettaglio) |
| 10 | CLIENTE:2306-2309 (idem) | Cliente: "Rimuovi Consegna" | `update … qta_prenotata_carico = qta_prenotata_carico + 1` (**asimmetrico**: annulla aumentando il carico invece di diminuire lo scarico; il netto è uguale, ma i due contatori crescono entrambi) |
| 11 | CLIENTE:2427-2430 (`cButton_disponibile_magazzino_ClickButtonArea`, CLIENTE:2379) | Cliente: "Consegna da Magazzino N" (libro non confermato/ordinato/arrivato ma con `qta_locale > 0`) | `update … qta_locale_scarico = qta_locale_scarico + 1` |
| 12 | CLIENTE:2388-2391 (idem) | Cliente: "Rientro in Magazzino" | `update … qta_locale_scarico = qta_locale_scarico - 1` |
| 13 | MAG:1394-1428 + `Registra` generico (FORM_01:1035-1042) | Magazzino: rettifiche +/− e qualsiasi modifica/salvataggio | UPDATE/INSERT generati da `OleDbCommandBuilder` su `Magazzino.*` |
| 14 | FORM_01:1278-1337 | Magazzino: Elimina | DELETE generato dal CommandBuilder |

Note trasversali:
- Tutte le query sono **concatenate a stringa** (codice volume tra apici, nessun parametro) ed eseguite con `GS_LIB_Dbase_Calcola_Sql`, che **inghiotte qualsiasi eccezione e ritorna 0** (FORM_01:2612-2632): un UPDATE fallito non dà errore.
- In #1-#6 manca lo spazio prima di `where`/`from` (`"+ 1" + "where "`, `",1,0,0,0" + "from …"`, BOLLA:2509-2510, 2523-2524). [IPOTESI] T-SQL lo tollera (`1where` viene separato dal lexer); se non lo tollerasse, l'errore sarebbe comunque nascosto.
- Sequenza "conta poi inserisci" senza transazione (BOLLA:2505-2527): due postazioni possono creare due righe per lo stesso ISBN.
- Nessuna tabella di movimenti: **la storia dei carichi/scarichi non esiste**, solo i contatori.

### 1.6 `elca_articoli` e scorta minima
Unico riferimento: `MENU:170-192`, `Controllo_Periodico()` → `select count(*) from elca_articoli where giacenza < Scorta_Minima`. **[FATTO] il metodo non è mai chiamato** (il timer `Timer_controllo_Tick`, `MENU:166-168`, è vuoto). La tabella `elca_articoli` (colonne `giacenza`, `Scorta_Minima`) [IPOTESI] appartiene a un altro gestionale dello stesso autore e potrebbe non esistere nel DB MIKE. Nessuna gestione "scorta minima" per i libri.

### 1.7 Stampe del Magazzino
Nessuna (vedi §1.3). `GS_MAG_MAGAZZINO_STAMPE.cs` è un dialogo a 3 pulsanti ("Stampa 1/2/3", titolo "Stampa Ordini") mai usato.

---

## 2. Menu e avvio

### 2.1 Avvio (`GS_MAG/GS_MAG/Program.cs`)
- Mutex di sistema `"GIGISOFT"`: se già presente → "Una istanza dell'applicazione è già in esecuzione." ed esce (Program.cs:13-18). Un'istanza per PC.
- Avvia `GS_MAG_MENU` (Program.cs:21).

### 2.2 Configurazione server — tutta cablata (`MENU:112-122`)
- `GS_server = "GIGI\\MSSQLSERVER19ENT"` (riga 114, subito sovrascritto) poi `GS_server = "<IP Hamachi>\\SQLEXPRESS"` (riga 116). [IPOTESI] 25.x.x.x è lo spazio indirizzi tipico di **LogMeIn Hamachi** (VPN): il DB del negozio è raggiunto via VPN.
- `GS_database = "MIKE"` (riga 117); utente e password SQL **cablati in chiaro** alle righe 118-119 (utente amministratore di SQL Server).
- Nessun file di configurazione per la connessione: i `.config` contengono solo runtime .NET 4.6 e l'endpoint SOAP Magento (`GS_LIB.dll.config`: `http://www.itsystemshop.it/index.php/api/v2_soap/index/`).
- Altro server cablato in `GS_MAG_SCHEDE/GS_MAG/GS_MAG_SCHEDE.cs:159` (connessione `SqlClient` per gli import CSV): `Server=BAMB?\SQLEXPRESS;Database=MIKE` (nome macchina con carattere accentato malamente decodificato, [IPOTESI] "BAMBÙ") con credenziali cablate. Quindi **due server diversi** a seconda della funzione.
- Provider: `SQLOLEDB` via `OleDbConnection` (FORM_00:622, FORM_01:1552), timeout 30 s.

### 2.3 Scadenza (licenza a tempo) — **[FATTO]**
`MENU:143-148`: in `GS_MAG_MENU_Inizializza` (chiamato al primo Paint) `if (DateTime.Now > new DateTime(2025,1,1)) Close();` ⇒ **questa build si chiude da sola dal 1/1/2025**, senza messaggio. I DLL in `mik/x/MIK/BAMBU` sono datati 11 set 2023. Va chiarito quale eseguibile usa davvero il negozio oggi (vedi domande).

### 2.4 Controlli hardware — **[FATTO] presenti ma morti**
`MENU:235-345`: `Cript` (MD5 → cifre mod 10), `GetBoardSerialNumber` (WMI `Win32_BaseBoard.SerialNumber`), `GetFirstLogicalDisk` (`Win32_LogicalDisk.VolumeSerialNumber`, mostra MessageBox per ogni disco), `GetFDeviceList` (`Win32_PnPEntity`, MessageBox), `MakeHardwareKey` (concatena seriale scheda madre + disco con sale cablato e applica `Cript`), `usb()` (`Win32_DiskDrive` USB). **Nessuno è richiamato** da nessuna parte: non c'è verifica di licenza hardware attiva, solo la data di scadenza. Anche `SendMail` è vuoto (`MENU:194-196`), `th1` vuoto, `flag_email`, `contatore_sottoscorta` inutilizzati.

### 2.5 Menu (`GS_MAG_MENU`, eredita `GS_LIB_FORM_00`)
Finestra principale MDI 1274×1019 in alto a sinistra, titolo "GESTIONE MAGAZZINO" (`MENU:124-136`). Massimizzazione bloccata (`FORM_00:279-285`, filtra `SC_MAXIMIZE`), ridimensionamento massimo 1274×1019 (`FORM_00:806-816`).
Pulsanti (ordine verticale, `MENU:646-997`):

| Ordine | Testo | Y | Apre | Riga |
|---|---|---|---|---|
| 1 | MAGAZZINO | 310 | `GS_MAG_MAGAZZINO` | MENU:453-475, 989-997 |
| 2 | BOLLE | 351 | `GS_MAG_SCHEDE_BOLLA` | MENU:430-452, 709-717 |
| 3 | ORDINI | 392 | `GS_MAG_SCHEDE_ORDINE` | MENU:407-429, 745-753 |
| 4 | CLIENTI | 433 | `GS_MAG_SCHEDE_CLIENTE` | MENU:384-406, 781-789 |
| 5 | SCUOLE | 471 | `GS_MAG_SCHEDE` | MENU:361-383, 817-825 |
| — | ESCI | 885 (basso) | chiude l'app | MENU:222-225, 867-878 |

Apertura sezione: mostra etichetta "Caricamento Scheda …", crea il form figlio MDI 1252×975 in (0,0) e lo mostra (`MENU:373-475`). Il figlio, quando appare, nasconde il menu (`FORM_01:709-721` → `GS_MAG_MENU_Hide`, `MENU:198-201`); alla chiusura lo riaccende (`FORM_01:4508-4529` → `GS_MAG_MENU_Show`). Si possono aprire **più istanze** della stessa sezione (nessun controllo). Esiste una seconda pagina "MENU 2" vuota (`MENU:156-157`, `tabPage_1`). Nessun login/utente: l'utente di audit è "gigisoft" cablato in ogni scheda (es. `MAG:607`).

---

## 3. Motore GS_LIB (cosa fanno i pulsanti in **ogni** scheda)

### 3.1 Struttura
- `GS_LIB_FORM_00` (`GS_LIB/GS_LIB/GS_LIB_FORM_00.cs`): base del **menu**. Ha array 100×100 per connessioni/dataset quasi inutilizzati, i "parametri" di scambio fra form (`parametri_operazioni`, `parametri_in/out_*`, FORM_00:35-43) e i virtual `GS_MAG_MENU_Hide/Show`.
- `GS_LIB_FORM_01` (6814 righe): base di **tutte le schede**. Barra multifunzione (ribbon Syncfusion) con i pulsanti; barra di stato con record corrente/trovati/totali; griglia "Elenco"; viewer Crystal; pannello "Inf" con campi di audit.
- Ogni azione è il **template** `X_Prima → X → X_Dopo`, tutti `virtual`; le schede fanno override (FORM_01:809-1520).
- Dati: tabelle di stato indicizzate `[IC, IT]` con `IC` 0..4 ("sessioni") e `IT` 0..24 ("dataset") (FORM_01:173-175, 472-561). Per ogni `[IC,IT]`: `Tabella`, `Select`, `Select_Top`, `Where`, `Where_Base`, `Where_Add`, `Order`, `Inner_Tabella/Colonne/Colonna_1/2` (un solo LEFT JOIN), `Tabella_Key_Col`, `DataSet`, `OleDbDataAdapter`, `BindingManagerBase`, contatori record, stato toolbar, stato operazione.
- Convenzione delle schede: `[0,0]` = testata (record principale della scheda), `[0,10]` = righe di dettaglio nella griglia `GS_LIB_GRID_001`, `[0,1]`, `[0,2]`, `[0,11]`, `[0,15]` = dataset di appoggio/lookup.
- **Ogni tabella deve avere `key_key`** (usata per conteggi `SELECT COUNT(key_key)`, FORM_01:2417, e come chiave per rilettura/cancellazione) e le colonne di audit `inserimento_utente_key_key, inserimento_utente_nome, inserimento_data, modifica_utente_key_key, modifica_utente_nome, modifica_data` (FORM_01:986-991, 1008-1010; legate ai campi del pannello Inf FORM_01:6410-6712).

### 3.2 Legame controlli ↔ colonne (data binding)
Non si usa `Tag` né il nome del controllo. I controlli personalizzati (`GS_LIB_TextBox`, `GS_LIB_DoubleTextBox`, `GS_LIB_IntegerTextBox`, `GS_LIB_DateTimePickerAdv`, `GS_LIB_ComboBoxAdv`, `GS_LIB_MultiColumnComboBox`, `GS_LIB_CheckBoxAdv`) hanno proprietà impostate nel designer:
- `GS_LIB_Colonna` = nome colonna;
- `GS_LIB_Indice` = stringa di 4 cifre `"CCTT"` → `IC = CC`, `IT = TT` (es. `"0000"` testata, `"0010"` dettaglio);
- `GS_LIB_Tabella` = nome tabella, **usato solo per costruire la WHERE di ricerca** (non per il binding);
- `GS_LIB_Ricerca_Abilitata` (bool) e `GS_LIB_Ricerca_Tipo` (`"="`, `">="`, `">"`, `"<="`, `"<"`);
- `GS_LIB_Colonna_Tipo` (`"T"`/`"N"`, solo combo);
- `GS_LIB_Prossimo_Controllo` (fuoco al Tab/Invio), `GS_LIB_Multibox_*` (lookup a tendina: **mai abilitato** in nessun modulo, 0 occorrenze di `Multibox_Abilitato = true`).

`GS_LIB_Bind(control, "add"|"clear", IC, IT)` (FORM_01:2002-2380) scorre **ricorsivamente** tutti i controlli del form; per quelli il cui `GS_LIB_Indice` corrisponde a `[IC,IT]` aggiunge/toglie un `DataBinding` di `Text` (o `BindableValue` per le date, `Checked` per le checkbox con conversione 1/0/NULL, FORM_01:3351-3369) sul `DefaultView` della prima tabella del dataset. Il record mostrato è quello alla posizione corrente del `BindingManager`.

Campi **non legati** (colonna vuota) vengono scritti dal codice della scheda con `GS_LIB_SetColonna(IC,IT,col,val)` (FORM_01:1956-1962): accoda in un dizionario applicato al prossimo Registra; **se la colonna è già in coda, il nuovo valore viene ignorato** (vince il primo).

### 3.3 Pulsanti — semantica esatta
Ogni pulsante agisce sul dataset "corrente" `[IC_Corrente, IT_Corrente]` (quasi sempre `[0,0]`) e solo se il dataset è pronto (`Dset_Pronto == "ok"`; nota: il controllo interno usa per errore `[IC, IC]` invece di `[IC, IT]`, FORM_01:830, 852, 874, 896, 918, 955, 1115, 1141, 1180, 1288, 1381, 1426, 1469, 1482). Navigazione, Nuovo, Cerca, Refresh, Stampa, Elenco fanno prima `RejectChanges()` sul dataset (FORM_01:584-703): **le modifiche non salvate si perdono senza avviso**.

- **Primo/Prec./Succ./Ultimo** (FORM_01:824-910, 1964-2000): spostano la posizione del `BindingManager` (annullando l'edit corrente). Nella barra di stato si può digitare un numero di record e premere Invio ("salta", FORM_01:4554-4563).
- **Nuovo** (FORM_01:916-935): salva posizione e stato toolbar, stato operazione `"immissione"`, toolbar `"0000001001000000"` (solo Registra e Annulla), `AddNew()` sulla vista, chiama `GS_LIB_Immissione_Automatica` (hook per valori di default; nel Magazzino vuoto), poi `Nuovo_Dopo` azzera le checkbox.
- **Registra** (FORM_01:945-1095):
  1. sposta il fuoco su un campo nascosto `GS` scrivendoci "pippo" per forzare la conferma del binding (FORM_01:952-954);
  2. hook di validazione: `Registra_Controlla_Immissione` (nuovo) o `Registra_Controlla_Corrente` (modifica), poi `Registra_Controlla` (entrambi) — se false si ferma;
  3. imposta audit: su nuovo `inserimento_*` e `modifica_*` = utente scheda + `DateTime.Now`; su modifica solo `modifica_*`; applica le colonne accodate con `SetColonna`;
  4. in modifica verifica che il record esista ancora (`SELECT … where Tabella.key_key = N`), altrimenti "Record Cancellato da altro utente";
  5. ricostruisce il `SelectCommand` come `SELECT <Select> FROM <Tabella>` (senza JOIN) sulla **connessione 0** e usa `OleDbCommandBuilder` (UPDATE/INSERT/DELETE automatici con **concorrenza ottimistica**: la WHERE confronta tutti i valori originali) → `adapter.Update` (FORM_01:1035-1042);
  6. se `DBConcurrencyException`: "Record Modificato da altro utente — Sarà ricaricato", rilegge solo quel record (`where key_key = N`) e lo mostra (FORM_01:1044-1058);
  7. se era un nuovo record: rilegge il record con `key_key = MAX(key_key)` della tabella (FORM_01:1060-1070) — quindi `key_key` è [IPOTESI] `IDENTITY`; con due inserimenti simultanei può mostrare il record dell'altro;
  8. hook `Registra_Dopo_Immissione` / `Registra_Dopo_Attuale`, `Registra_Dopo`, poi `Refresh`;
  9. se la scheda era stata aperta in modalità "nuovo" da un'altra (`parametri_operazioni[1]=="nuovo"`), copia le colonne richieste in `parametri_out_*` e chiude (FORM_01:1081-1093). **Meccanismo mai attivato** (nessun modulo imposta `parametri_operazioni[1]`).
- **Cerca** (FORM_01:1113-1129): stato `"ricerca"`, toolbar `"0000000011000000"` (Applica, Annulla), **stacca il binding e svuota i campi**: l'utente scrive i criteri negli stessi campi della scheda.
- **Applica** (FORM_01:1139-1155): azzera la WHERE di ricerca, chiama `GS_LIB_Make_Sql` (§3.4), hook `Make_Sql_Dopo`, svuota e **riapre il dataset in un thread** con la nuova WHERE, ricollega i campi. Progress bar animata da un timer da 500 ms (FORM_01:2736-2779). Esc durante la ricerca interrompe il thread (`Thread.Abort`, FORM_01:4593-4597).
- **Annulla** (FORM_01:1170-1244): torna allo stato toolbar precedente; da "immissione" annulla l'AddNew e **ricarica tutto il dataset** dalla query corrente tornando al record di prima; da "ricerca" ricollega i campi; da "stampa" nasconde il viewer; da "elenco" nasconde la griglia. Se la scheda era in modalità "nuovo" chiude il form.
- **Elimina** (FORM_01:1278-1356): verifica esistenza del record, hook `GS_LIB_Controlla_Elimina` / `Elimina_Controlla`, **doppia conferma** ("CONFERMI ELIMINAZIONE ?" Sì/No, poi "SICURO ?"), `Elimina_Prima` (di base chiama `Dettaglio_Elimina_Tutto("GS_LIB_GRID_001")`: è qui che le schede cancellano le righe figlie), `Row.Delete()` + `adapter.Update` con CommandBuilder su `SELECT * FROM <Tabella>`. **Hard delete**, nessuna cancellazione logica.
- **Refresh** (FORM_01:1366-1413): rilegge dal DB solo il record corrente per `key_key` e ne copia i valori nella riga del dataset.
- **Stampa** (FORM_01:1423-1457, 2805-2889): carica `<cartella exe>\<GS_LIB_File_Report>` (Crystal Reports), passa eventuali parametri (`GS_LIB_Parametri_Report_Name/Val`), forza login al DB (server/db/utente/password della connessione `IC`) su report e sottoreport, applica come **SelectionFormula** la `Where_Report` (sintassi Crystal `{Tabella.col} = …`), mostra il viewer a tutto schermo; se `GS_Report_Direct_Print == "ok"` stampa direttamente 1 copia sulla stampante predefinita e annulla (FORM_01:2877-2881).
- **Duplica** (FORM_01:1467-1470): **non fa nulla**.
- **Elenco** (FORM_01:1480-1520): mostra la griglia `GS_LIB_Grid_Elenco` a tutta pagina in sola lettura con `DataSource = dataset [0,0]` (sempre `[0,0]`, cablato), stessa selezione dei record trovati; le schede personalizzano colonne in `GS_LIB_Elenco_Settings`; toolbar `"0111100001000000"` (navigazione + Annulla).
- **Chiudi**: chiude il form; il menu riappare.
- **Prec./Succ. scheda** (FORM_01:773-807): cambiano pagina del `TabControl` (pagine `tabPage_N`, pannelli `gradientPanel_N` con colore e titolo propri).

### 3.4 Ricerca: come nasce la WHERE (`GS_LIB_Make_Sql`, FORM_01:3700-4348)
Per ogni controllo (ricorsivo) con testo non vuoto, `Ricerca_Abilitata`, `Tabella`+`Colonna`+`Indice` valorizzati e indice = dataset corrente, aggiunge un pezzo ` and <GS_LIB_Tabella>.<colonna> …` a `Where_Ricerca` e il corrispondente Crystal a `Where_Ricerca_Report`:
- **TextBox**: `">="` ⇒ `LIKE 'testo%'` (inizia per), `"="` ⇒ `= 'testo'`; apici raddoppiati (FORM_01:3933-3982). Nessuna distinzione maiuscole [IPOTESI: dipende dalla collation].
- **DoubleTextBox**: confronto numerico con l'operatore scelto, virgola → punto (FORM_01:3984-4063).
- **IntegerTextBox**: come sopra ma **senza prefisso tabella**; per il report usa sempre `>=` qualunque sia l'operatore (FORM_01:4065-4122).
- **DateTimePicker** (se non nullo): ricostruisce la data dal testo `dd/MM/yyyy HH:mm:ss` (dipende dalla cultura italiana di Windows), SQL `'yyyyMMdd H:m:s'`, Crystal `#yyyy/MM/dd H:m:s#` (FORM_01:4124-4286).
- **CheckBox**: se non "indeterminato" ⇒ `= 1` / `= 0` (senza prefisso tabella) (FORM_01:4288-4329).
- **ComboBoxAdv**: **toglie gli ultimi 2 caratteri** del testo prima di cercare (FORM_01:3850) — [IPOTESI] per eliminare un suffisso di visualizzazione.
- **MultiColumnComboBox**: se `Colonna_Tipo` non è "T" fa un cast sbagliato a `ComboBoxAdv` ⇒ eccezione (FORM_01:3746).
Composizione finale (FORM_01:4333-4346): `Where = " where " + (Where_Add + Where_Ricerca + Where_Base).Substring(5)`; i pezzi iniziano tutti con `" and "` (5 caratteri), per questo `Where_Base` deve iniziare con 5 caratteri da scartare (" and " o "where"). Query finale (FORM_01:1577-1744): `SELECT <Select_Top> <Select>[, <Inner_Colonne>] FROM <Tabella> [LEFT OUTER JOIN <Inner_Tabella> ON <c1> = <c2>] <Where> <Where_Base> <Order>`. Caso speciale cablato per `[110,110]` su `ITSYS_Clienti_Interventi` (FORM_01:1710-1722): fuori dagli array (max 5×25), **codice morto** di un altro prodotto.

Implicazione per chi riscrive: "Cerca" = form di filtro con gli stessi campi della scheda; testo = "inizia per", numeri/date = operatore fisso per campo deciso nel designer; i filtri sono in AND.

### 3.5 Toolbar: stringa di stato a 16 caratteri (FORM_01:4350-4486)
Posizioni: 0 Chiudi, 1 Primo, 2 Prec., 3 Succ., 4 Ultimo, 5 Nuovo, 6 Registra, 7 Cerca, 8 Applica, 9 Annulla, 10 Elimina, 11 Refresh, 12 Stampa, 13 Duplica, 14 Elenco, 15 casella "record corrente".
Stati: record trovati `1111111100111111`; tabella vuota `1000010000000000`; nessun risultato ma tabella piena `1000010100000000` (FORM_01:2382-2409); Nuovo `0000001001000000`; Cerca `0000000011000000`; Stampa `0000000001000000`; Elenco `0111100001000000`; thread di ricerca interrotto `0000010100000000`.

### 3.6 Griglie
- **Griglia di dettaglio `GS_LIB_Grid_00`** (`GS_LIB/GS_LIB/GS_LIB_Grid_00.cs`): user control con `GridGroupingControl` Syncfusion e pulsanti Aggiungi/Elimina/Registra (`CButton_aggiungi`, `cButton_elimina`, `cButton_registra`). `GS_LIB_Grid_Apri()` apre il dataset `[IC,IT]` del form padre e lo usa come `DataSource` (Grid_00:171-183). Gli eventi rimbalzano sul form come `GS_LIB_FORM_01_Dettaglio_{Nuovo,Registra,Elimina,Controlla_*,RecordValueChanged/Changing,SelectedRecordsChanged}(nomeGriglia, …)` (Grid_00:98-258). Cambiando riga fa `RejectChanges` del dataset di dettaglio (Grid_00:189-197). Ctrl+↑/↓ cambia l'altezza righe.
- Schema d'uso nelle schede: clic su riga ⇒ `Dettaglio_Bind(false)` (campi di dettaglio staccati, solo Aggiungi abilitato); doppio clic ⇒ `Dettaglio_Bind(true)` (campi di dettaglio legati alla riga, Elimina/Registra abilitati) (FORM_01:4666-4688; es. MAG:1282-1290).
- **Griglia Elenco**: vedi §3.3.

### 3.7 Altre funzioni di servizio di FORM_01
`GS_LIB_Dbase_Calcola_Sql` / `_s` / `_d` (scalare double/string/date, **errori ignorati → 0/""/default**, FORM_01:2612-2680); `Controlla_Esistenza*` (conteggio righe; la variante `_key_key` con tipo "N" ha un apice di troppo → SQL errato, FORM_01:2583); `Sql_Valore_Colonna` (ritorna `"~~~~~"` se non trovato, FORM_01:2682-2729); `Calcola_Imm_Auto_Max` (MAX+1); `GS_LIB_Formatta_Data` (stringa data SQL `yyyyMMdd HH:mm:ss[.fff]` o `dd/MM/yyyy …`, FORM_01:4718-4792); `GS_LIB_Dbase_Dataset_Update` (salva il dataset senza le verifiche di Registra, FORM_01:1915-1934); `GS_LIB_Colonna_Update`.

### 3.8 Import/Export Excel
- `GS_LIB_Dbase_ConnettiExcel` (Jet 4.0 / ACE 12 su file .xls/.xlsx, FORM_01:1522-1543): **mai chiamato** in nessun modulo. Nessun export Excel nel codice (le DLL Syncfusion XlsIO/DocIO/Pdf sono distribuite ma non referenziate dal codice).
- Gli unici import sono **CSV con CsvHelper** in `GS_MAG_SCHEDE` (file `libri.csv`, `scuole.csv` nella cartella corrente, `C:\LAV\MIKE\filecsvministero\gigi.csv`, e due download web; `GS_MAG_SCHEDE.cs:1921-2280`) — da inventariare col modulo Scuole.

### 3.9 Magento
`GS_LIB_FORM_00_Magento_*` (FORM_01:4794-4878): client SOAP v2 (`MagentoServiceReference`, endpoint itsystemshop.it) con login cablato (utente/password in chiaro a FORM_01:4809-4810), lista prodotti, info prodotto (ean, condizione, peso, prezzo), aggiorna prezzo, aggiorna/legge giacenza. **[FATTO] Nessun modulo li chiama: codice morto**, eredità di un altro prodotto (ITSYS). Da non migrare.

### 3.10 Altro codice morto della libreria
`MicroTimer`/`OnMicroTimedEvent` (campo mai istanziato, FORM_01:64, 2960-2989); `RibbonForm1.cs`; `GS_LIB/GS_LIB/Program.cs` (main di test); cartella `GS_LIB/GesMag` (Button/label/Panel); i pulsanti "Nuovo/Apri/Stampa/Copia/Incolla/?" della toolstrip standard in FORM_00/01 non collegati alla logica.

---

## 4. Tabelle e viste del DB citate in tutto il codice

Metodo: grep su tutti i progetti di `from/into/update/join`, assegnazioni `Dbase_Tabella[..]`, binding `GS_LIB_Colonna`+`GS_LIB_Indice`, `SetColonna`, letture `Rows[..]["col"]`, colonne griglia, formule Crystal. Tipi = **[IPOTESI]** dedotti dal controllo usato / dai valori.
Colonne comuni a tutte le tabelle gestite dal motore (§3.1): `key_key` (int identity [IPOTESI]), `inserimento_utente_key_key` (int), `inserimento_utente_nome` (varchar), `inserimento_data` (datetime), `modifica_utente_key_key`, `modifica_utente_nome`, `modifica_data`.

| Tabella / vista | Colonne dedotte (oltre a quelle comuni) | Tipi probabili | Usata da |
|---|---|---|---|
| `Magazzino` | codice_volume, materia_disiplina, autori, titolo, volume, editore, prezzo, nuova_adozione, da_acquistare, cons, qta_prenotata_carico, qta_prenotata_scarico, qta_prenotata, qta_locale_carico, qta_locale_scarico, qta_locale | testi varchar; prezzo decimal/float; qta_* numerici; qta_locale e qta_prenotata forse calcolate | MAGAZZINO (CRUD), BOLLA (insert/update, lookup `[0,2]`), CLIENTE (update, lettura qta_locale) |
| `Schede_Testata` | data, anno_scolastico, codice_scuola, tipo_scuola, classe, corso, nominativo_scuola, indirizzo_scuola, cap_scuola, citta_scuola, provincia_scuola, totale | data datetime; totale money/decimal | SCHEDE (CRUD), CLIENTE (lettura dati scuola) |
| `Schede_Dettaglio` | keykey_testata, anno_testata, codice_scuola_testata, classe_testata, data_testata, codice_volume, materia_disiplina, autori, titolo, volume, editore, prezzo, nuova_adozione, da_acquistare, cons | keykey_testata int (FK → Schede_Testata.key_key); nuova_adozione/da_acquistare/cons 'SI'/'NO' | SCHEDE (CRUD + import), CLIENTE e ORDINE (lettura), MAGAZZINO (griglia morta) |
| `Cliente_Testata` | data, anno_scolastico, codice_scuola, tipo_scuola, classe, corso, nominativo_scuola, indirizzo_scuola, cap_scuola, citta_scuola, provincia_scuola, cliente_cognome, cliente_nome, cliente_codice_fiscale, cliente_telefono, cliente_progressivo, cliente_progressivo_barcode, acconto, totale | acconto/totale decimal | CLIENTE; report Mike_Cliente |
| `Cliente_Dettaglio` | keykey_testata, anno_testata, codice_scuola_testata, classe_testata, data_testata, progressivo_testata, barcode, materia_disiplina, codice_volume, autori, titolo, volume, editore, prezzo, nuova_adozione, da_acquistare, cons, confermato, ordinato, arrivato, consegnato, confermato_data, ordinato_data, arrivato_data, consegnato_data, ordinato_numero, arrivato_numero | flag 'SI'/'NO' varchar; *_data datetime; *_numero numerici | CLIENTE (CRUD), BOLLA (update arrivato, lookup), ORDINE [vedi inventario Ordini]; report Mike_Cliente |
| `Ordine_Testata` | data, anno_scolastico, ordine_progressivo, ordine_progressivo_barcode, ordine_fornitore_cognome, ordine_fornitore_nome, ordine_fornitore_codice_fiscale, totale | | ORDINE |
| `Ordine_Dettaglio` | come Cliente_Dettaglio (senza consegnato_data in insert) + key_key_cliente_dettaglio, tipo, consegnato, consegnato_data | tipo varchar ('importato'/'locale' [IPOTESI]) | ORDINE (CRUD), BOLLA (update arrivato, lookup), CLIENTE (update consegnato) |
| `Bolla_Testata` | stesse colonne di Ordine_Testata (copiate) | | BOLLA |
| `Bolla_Dettaglio` | come Ordine_Dettaglio + key_key_ordine_dettaglio, consegnato, consegnato_data | | BOLLA (CRUD, fonte insert-select in Magazzino), CLIENTE (update consegnato); report Mike_Bolle_Clienti, Mike_Bolle_BarCode |
| `ImportazioniLibri` | CODICESCUOLA, ANNOCORSO, TIPOGRADOSCUOLA, COMBINAZIONE, DISCIPLINA, CODICEISBN, AUTORI, TITOLO, SOTTOTITOLO, VOLUME, EDITORE, PREZZO, NUOVAADOZ, DAACQUIST, CONSIGLIATO | tracciato CSV del Ministero (adozioni) | SCHEDE (import, `GS_MAG_SCHEDE.cs:1948`) |
| `ImportazioniScuole` | ANNOSCOLASTICO, AREAGEOGRAFICA, REGIONE, PROVINCIA, CODICEISTITUTORIFERIMENTO, DENOMINAZIONEISTITUTORIFERIMENTO, CODICESCUOLA, DENOMINAZIONESCUOLA, INDIRIZZOSCUOLA, CAPSCUOLA, CODICECOMUNESCUOLA, DESCRIZIONECARATTERISTICASCUOLA, DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA, INDICAZIONESEDEDIRETTIVO, INDICAZIONESEDEOMNICOMPRENSIVO, INDIRIZZOEMAILSCUOLA, INDIRIZZOPECSCUOLA, SITOWEBSCUOLA, SEDESCOLASTICA | anagrafe scuole MIUR | SCHEDE (import, `GS_MAG_SCHEDE.cs:2040`) |
| `Codici_Da_Ordinare_View` (vista) | codice_volume, quantita | | ORDINE (dataset `[0,11]`/`[0,15]`) |
| `Codici_Ordinati_Raggruppati_View` (vista) | codice_volume, quantita | | BOLLA (`[0,11]`) |
| `Codici_Ordinati_View` (vista) | keykey_testata, arrivato, … | | solo report Mike_Ordini_Ordinati_* |
| `elca_articoli` | giacenza, Scorta_Minima | | MENU, codice morto |
| `ITSYS_Clienti_Interventi`, `ITSYS_Clienti` | Cliente_Codice, codice, nome | | FORM_01:1710-1722, codice morto di altro prodotto |

La definizione SQL delle tre viste non è nel codice: va estratta dal DB.

---

## 5. Report Crystal (`mik/x/MIK/BAMBU/*.rpt`)

`strings` e `strings -e l` (e un tentativo di decompressione zlib) **non restituiscono nulla di utile**: i file sono contenitori OLE (`Root Entry`, `Contents`, `QESession`, `ReportInfo`, `SummaryInformation`) col contenuto compresso/codificato in formato proprietario Crystal; nessun nome di tabella, campo o testo leggibile. Le informazioni seguenti vengono dal **codice che li invoca**. Per i layout reali servono Crystal Reports / un convertitore, o una stampa fatta in negozio.

| File | Invocato da | Filtro (SelectionFormula) | Cosa stampa [dedotto] |
|---|---|---|---|
| Mike_Bolle_BarCode.rpt (13 KB) | BOLLA:2488-2498 (`Stampa_Barcode`), pulsante barcode BOLLA:2477 e automatico all'arrivo se `checkBox_abilita_stampa` (BOLLA:2041-2044) | `{Bolla_Dettaglio.key_key_cliente_dettaglio} = <id>` | etichetta con codice a barre della singola copia arrivata per un cliente; **stampa diretta** senza anteprima |
| Mike_Bolle_Clienti.rpt (49 KB) | BOLLA:563 (Stampa, scelta 1) | `{Bolla_Dettaglio.keykey_testata} = <id bolla>` | righe della bolla di arrivo (con riferimento clienti) |
| Mike_Cliente.rpt (50 KB) | CLIENTE:596 (Stampa, scelta 1) | `{Cliente_Testata.key_key} = <id> and {Cliente_Dettaglio.confermato} = 'SI'` | scheda/ricevuta cliente con i libri confermati |
| Mike_Ordini_Ordinati_Ordinati.rpt (48 KB) | ORDINE:551 (scelta 1) | `{Codici_Ordinati_View.keykey_testata} = <id ordine>` | libri ordinati al fornitore in quell'ordine |
| Mike_Ordini_Ordinati_Arrivati.rpt (48 KB) | ORDINE:556 (scelta 2) | come sopra `and {Codici_Ordinati_View.arrivato} = 'SI'` | libri dell'ordine già arrivati |
| Mike_Ordini_DaOrdinare.rpt (47 KB) | ORDINE:562 (scelta 3) | nessuno | elenco codici da ordinare [IPOTESI: su `Codici_Da_Ordinare_View`] |

Il Magazzino non ha report.

---

## 6. Stranezze, codice morto, valori cablati, rischi

**Sicurezza / configurazione**
1. Credenziali SQL Server (utente amministratore) in chiaro nel menu (`MENU:118-119`) e nella stringa di import (`GS_MAG_SCHEDE.cs:159`); credenziali Magento in chiaro (FORM_01:4809-4810). Vanno considerate compromesse e cambiate prima/dopo la migrazione.
2. Indirizzo DB cablato su IP VPN (`MENU:116`) e server diverso per gli import (`GS_MAG_SCHEDE.cs:159`).
3. Tutto l'SQL è concatenato senza parametri (iniezione possibile con un apice nel codice volume, tranne nella ricerca dove gli apici sono raddoppiati).

**Funzionali**
4. **Scadenza 1/1/2025** che chiude l'applicazione (`MENU:143-148`).
5. Errori SQL nascosti: `Calcola_Sql` ritorna 0 in caso di eccezione (FORM_01:2612-2632) ⇒ aggiornamenti di magazzino falliti silenziosamente.
6. Nessuna transazione: in Bolla/Cliente l'aggiornamento di `Ordine_Dettaglio`, `Cliente_Dettaglio`, `Bolla_Dettaglio` e `Magazzino` è fatto con comandi separati; un'interruzione lascia dati incoerenti.
7. Insert-select in Magazzino senza filtro di riga (BOLLA:2544-2554) ⇒ possibili righe duplicate per lo stesso ISBN; univocità ISBN verificata solo in modifica (MAG:748-759).
8. Rettifiche manuali senza controllo di negatività (MAG:1404, 1414).
9. `qta_locale`/`qta_prenotata` mai scritte dai moduli movimentazione (se non sono colonne calcolate, la disponibilità mostrata al cliente è sbagliata).
10. "Rimuovi Consegna" incrementa `qta_prenotata_carico` invece di decrementare `qta_prenotata_scarico` (CLIENTE:2306).
11. Nessuno storico movimenti: impossibile ricostruire una giacenza a una data.
12. Nuovi record riletti per `MAX(key_key)` (FORM_01:1063): con più postazioni può mostrare il record di un altro.
13. `RejectChanges` silenzioso su navigazione/Cerca (FORM_01:584-703): perdita di modifiche non salvate.

**Bug del motore (rilevanti per tutti i moduli)**
14. `Dset_Pronto[IC, IC]` invece di `[IC, IT]` in tutti i pulsanti (§3.3).
15. Cast errato `MultiColumnComboBox` → `ComboBoxAdv` in ricerca (FORM_01:3746); ComboBoxAdv tronca 2 caratteri (FORM_01:3850).
16. `Controlla_Esistenza_key_key` tipo "N" genera SQL con apice spurio (FORM_01:2583; idem FORM_00).
17. La ricerca usa `GS_LIB_Tabella` del controllo come prefisso: in BOLLA i controlli di testata/dettaglio dichiarano `ordine_testata`/`ordine_dettaglio` mentre le tabelle reali sono `Bolla_*` (risultato di `colscan` sul designer) ⇒ [IPOTESI forte] "Cerca" nelle Bolle genera SQL non valido.
18. WHERE con precedenza AND/OR errata in BOLLA:2353 (`… and arrivato = 'NO' or tipo = 'locale'`) ⇒ il lookup per codice prende anche righe "locale" di **qualsiasi** codice (da approfondire nell'inventario Bolle).

**Codice morto da non migrare**
19. Controlli hardware/licenza WMI e `MakeHardwareKey` (MENU:235-345), `Controllo_Periodico`/`elca_articoli`, `SendMail`, timer vuoto, pagina "MENU 2".
20. Magento SOAP (FORM_01:4794-4878), Excel (FORM_01:1522-1543), MicroTimer, `RibbonForm1`, `GesMag/*`, caso `[110,110]` ITSYS.
21. Nel Magazzino: pagina 2 anagrafica non legata, griglia `Schede_Dettaglio` nascosta, `GS_MAG_MAGAZZINO_STAMPE`, gestione `parametri_operazioni` "fornitori"/"articoli" nel Paint (MAG:557-596), impostazioni Elenco con colonne di Schede (MAG:886-920), Duplica.
22. Meccanismo "apri scheda in modalità nuovo e ritorna valori" (`parametri_*`, `caller`) mai attivato.

**Valori cablati vari**
- Utente audit "gigisoft", id 0 (es. MAG:606-607); dimensioni finestre 1274×1019 / 1252×975; colori; date di default dei picker 4/6/2023 nei designer; percorso `C:\LAV\MIKE\filecsvministero\gigi.csv`.

---

## 7. Domande aperte per il negoziante

1. Che eseguibile usate oggi? Questa build si chiude da sola dal 1/1/2025: avete una versione più recente, la data del PC è indietro, o il programma non è più in uso?
2. Il DB è su un PC del negozio raggiunto via VPN (Hamachi?) o in locale? Lavorano più postazioni contemporaneamente?
3. "Qta Disponibile" e "Qta Prenotata" in Magazzino corrispondono alla realtà dopo che arriva una bolla, o vanno "sistemate" a mano? (serve per capire se sono colonne calcolate)
4. Che differenza fate tra "prenotato" e "locale"? Confermate: prenotato = arrivato per un cliente che l'ha ordinato; locale = copie libere in negozio?
5. Usate le rettifiche +/− in Magazzino? In quali casi (inventario, resi al fornitore, danneggiati, vendite al banco)? Le vendite al banco senza scheda cliente come le registrate?
6. Avete mai trovato lo stesso ISBN due volte in Magazzino o giacenze negative?
7. Resi al fornitore / rese a fine stagione: esistono? Oggi come li gestite?
8. Vi serve uno storico dei movimenti (chi/quando ha caricato o scaricato)?
9. Usate "Cerca" ed "Elenco" nella scheda Magazzino? Che ricerche fate più spesso (ISBN, titolo, editore, materia)?
10. Vi serve una stampa del magazzino (inventario, elenco disponibili, sotto scorta)? Oggi non esiste.
11. Le etichette barcode delle bolle: che stampante/formato etichetta usate? Potete fornire un PDF/foto di ciascuno dei 6 report?
12. Il sito Magento/itsystemshop e la "scorta minima" (elca_articoli) sono mai stati usati per questo negozio?
13. I campi "Nuovo", "Acquistare", "Consigliato" del libro sono sempre SI/NO? Cosa significano per voi in magazzino?
14. Avete altri utenti oltre a "gigisoft"? Vi serve sapere chi ha fatto cosa?
15. Gli import CSV del Ministero (libri e scuole) li fate ogni anno? Da dove scaricate i file?
