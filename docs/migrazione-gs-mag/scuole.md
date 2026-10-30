# Inventario funzionale: SCUOLE («Schede Scuole»)

Sorgenti (decompilati ILSpy, percorsi relativi a `scratchpad/src/`):

| Sigla | File |
|---|---|
| `SCH` | `GS_MAG_SCHEDE/GS_MAG/GS_MAG_SCHEDE.cs` (5108 righe) |
| `STP` | `GS_MAG_SCHEDE/GS_MAG/GS_MAG_SCHEDE_STAMPE.cs` (268 righe) |
| `F01` | `GS_LIB/GS_LIB/GS_LIB_FORM_01.cs` (classe base dei form) |
| `G00` | `GS_LIB/GS_LIB/GS_LIB_Grid_00.cs` (griglia di dettaglio con pulsanti) |
| `MENU` | `GS_MAG/GS_MAG/GS_MAG_MENU.cs` |
| `CLI` | `GS_MAG_SCHEDE_CLIENTE/GS_MAG/GS_MAG_SCHEDE_CLIENTE.cs` |

Convenzione: **[IPOTESI]** = dedotto, non dimostrato dal codice; **[DA VERIFICARE]** = serve il DB o il negoziante.

---

## 1. Scopo della sezione

Mantiene l'**elenco dei libri adottati per ogni classe di ogni scuola** in un anno scolastico (la «scheda» della classe): una testata (scuola, anno, classe, corso) con le righe dei libri (ISBN, materia, autori, titolo, volume, editore, prezzo, flag nuova adozione/da acquistare/consigliato). Le righe si inseriscono a mano oppure si scaricano **online dagli open data del Ministero** (dati.istruzione.it), e lo stesso vale per l'anagrafica della scuola. Le schede sono poi la sorgente da cui la sezione Clienti copia i libri da prenotare per l'alunno (`CLI:2137-2176`).

Si apre dal menu principale con il pulsante «schede» (`MENU:360-381`). Titolo finestra «SCHEDE SCUOLE» (`SCH:746`), titolo scheda «Schede Scuole» (`SCH:761`).

---

## 2. Schermata

### 2.0 Meccanismo generico di GS_LIB (serve per leggere il resto)

- Ogni controllo `GS_LIB_*` ha tre proprietà: `GS_LIB_Tabella`, `GS_LIB_Colonna`, `GS_LIB_Indice` (stringa «CCTT»: 2 cifre connessione, 2 cifre dataset). `GS_LIB_Bind(..., "add", c, t)` collega via DataBinding la proprietà `Text` (o `BindableValue` per le date) alla colonna del dataset `[c,t]`, ricorsivamente su tutti i figli (`F01:2002-2200`). Qui: indice `0000` = testata (`Schede_Testata`), indice `0010` = dettaglio (`Schede_Dettaglio`).
- **Toolbar standard** del form base (`F01:5673-6021`, abilitazione con una maschera di 16 caratteri `F01:4350-4488`): CHIUDI, Prec./Succ. (scheda/tab), Primo, Preced., Success., Ultimo, Nuovo, Registra, Cerca, Applica, Annulla, Elimina, Refresh, Stampa, Duplica, Elenco.
- **Cerca/Applica** = ricerca per esempio: «Cerca» svuota i campi (`F01:1113-1129`), l'utente compila, «Applica» costruisce la WHERE con tutti i campi non vuoti che hanno `GS_LIB_Ricerca_Abilitata=true` (`F01:3700-4331`): per i testi con `Ricerca_Tipo ">="` produce `colonna LIKE 'valore%'` (inizia per), per i numeri `>=`, con `"="` uguaglianza. Gli apici vengono raddoppiati.
- **Elenco** mostra tutti i record caricati in una griglia a tutto schermo, sola lettura (`F01:1480-1501`).
- **Registra** (`F01:945-1095`): validazioni (`Registra_Controlla_Immissione`/`_Corrente`/`Registra_Controlla`), poi imposta le colonne di audit `inserimento_*`/`modifica_*` (utente e data), applica i valori messi da parte con `GS_LIB_SetColonna`, salva con `OleDbDataAdapter.Update` (comandi generati da `OleDbCommandBuilder`). Dopo un inserimento ricarica il record con `key_key = MAX(key_key)` (`F01:1060-1070` + `F01:2521-2541`), quindi **`key_key` è con buona probabilità una IDENTITY del DB** [IPOTESI]. Gestisce la concorrenza ottimistica («Record Modificato da altro utente», `F01:1044-1059`).
- **Elimina** (`F01:1278-1356`): verifica esistenza, doppia conferma «CONFERMI ELIMINAZIONE ?» + «SICURO ?», poi chiama `GS_LIB_Button_Elimina_Prima`, che nel form base **cancella anche tutte le righe di dettaglio** (`F01:1270-1276` → `SCH:1169-1176`).
- **Griglia di dettaglio** `GS_LIB_Grid_00`: ha i pulsanti «Aggiungi», «Elimina», «Registra» (`G00:400,432,464`). Click su una riga = svuota i campi di dettaglio e abilita solo «Aggiungi»; **doppio click** = carica la riga nei campi e abilita «Elimina»/«Registra» (`SCH:1484-1492`, `F01:4666-4688`). «Elimina»/«Registra» senza riga selezionata col doppio click → «Selezionare Record» (`F01:4635-4655`).

### 2.1 Testata (tab «Schede Scuole», `tabPage_0`)

Disposizione per righe (coordinate da `InitializeComponent`). Tutti i campi sono legati a `Schede_Testata` (indice `0000`).

| Etichetta | Controllo | Colonna DB | Tipo controllo / note | Rif. |
|---|---|---|---|---|
| Data | `GS_LIB_DateTimePickerAdv_data` | `data` | data-ora, formato `dd/MM/yyyy HH:mm:ss`, **sola lettura** (sbloccata solo in Cerca); in Nuovo = ora corrente | `SCH:3913,3948-3960`, `SCH:486`, `SCH:540,563,582` |
| Codice Scuola | `GS_LIB_TextBox_codice_scuola` | `codice_scuola` | testo max 50; obbligatorio; all'uscita compila l'anagrafica (§3.4) | `SCH:3778-3811`, `SCH:1825-1854` |
| Tipo Scuola | `GS_LIB_TextBox_tipo_scuola` | `tipo_scuola` | testo max 50 | `SCH:3692-3724` |
| Anno | `GS_LIB_DoubleTextBox_anno` | `anno_scolastico` | numerico 0 decimali; obbligatorio; in Nuovo = **anno solare della data** | `SCH:3867-3903`, `SCH:487` |
| Classe | `GS_LIB_TextBox_classe` | `classe` | testo max 50; obbligatorio; formato atteso «1A», «3B» (1° carattere = anno di corso, resto = sezione, §3.5) | `SCH:3735-3767`, `SCH:1891-1893` |
| Corso | `GS_LIB_TextBox_corso` | `corso` | testo max 50, libero (indirizzo di studio?) [DA VERIFICARE] | `SCH:3822-3854` |
| *(pulsante)* «Importa OnLine» | `cButton_Importa_scuola_online` | — | scarica l'anagrafica scuola dal Ministero (§3.4) | `SCH:2835-2847`, `SCH:2317-2324` |
| Scuola | `GS_LIB_TextBox_nominativo_scuola` | `nominativo_scuola` | testo max 50 | `SCH:3649-3681` |
| Indirizzo | `GS_LIB_TextBox_indirizzo_scuola` | `indirizzo_scuola` | testo max 50 | `SCH:3606-3638` |
| CAP | `GS_LIB_TextBox_cap_scuola` | `cap_scuola` | testo max 50 | `SCH:3563-3595` |
| Città | `GS_LIB_TextBox_citta_scuola` | `citta_scuola` | testo max 50 | `SCH:3520-3552` |
| Provincia | `GS_LIB_TextBox_provincia_scuola` | `provincia_scuola` | testo max 50 | `SCH:3477-3509` |
| Totale (in basso a destra) | `gS_LIB_DoubleTextBox_totale` | `totale` | valuta; calcolato = somma `prezzo` delle righe (§3.3) | `SCH:2852-2895`, `SCH:1607-1616` |

Campi ricercabili (Cerca/Applica): tutti i precedenti, con «inizia per» sui testi, `=` sull'anno, `>=` su data e totale (`SCH:2882,3489-3952`).

### 2.2 Dettaglio libri (riquadro «Dettaglio Libri Scuola», `GS_LIB_GRID_001`)

Visibile solo quando c'è una testata corrente salvata e non si è in Nuovo/Cerca (`SCH:783-804`). Riga di input sopra la griglia, legata a `Schede_Dettaglio` (indice `0010`):

| Etichetta (intestazione griglia) | Controllo | Colonna DB | Tipo / note | Rif. |
|---|---|---|---|---|
| Nr | `GS_LIB_DoubleTextBox_scheda_nr` | `Nr` (calcolata `ROW_NUMBER() OVER(ORDER BY codice_volume)`) | sola lettura | `SCH:3352-3376`, `SCH:1408` |
| — | `GS_LIB_DoubleTextBox_scheda_key_key` | `key_key` | tecnico | `SCH:3394-3421` |
| — | `GS_LIB_DoubleTextBox_scheda_key_key_testata` | `keykey_testata` | tecnico (FK testata) | `SCH:3437-3464` |
| Cod.Volume | `GS_LIB_TextBox_codice_dett` | `codice_volume` | testo max 50 = **ISBN**; obbligatorio; univoco nella scheda; all'uscita autocompila dagli altri dettagli (§3.3) | `SCH:3302-3327`, `SCH:1790-1823` |
| Materia | `GS_LIB_TextBox_materia_dett` | `materia_disiplina` (sic) | testo max 50; obbligatorio; freccia giù = ingrandisce a 300×100, freccia su = ripristina | `SCH:3186-3213`, `SCH:1618-1647` |
| Autori | `GS_LIB_TextBox_autore_dett` | `autori` | testo max 200; obbligatorio; idem ingrandimento | `SCH:3265-3292` |
| Titolo | `GS_LIB_TextBox_titolo_dett` | `titolo` | testo max 200; obbligatorio; idem | `SCH:3149-3176` |
| Vol. | `GS_LIB_TextBox_volume_dett` | `volume` | testo max 50; obbligatorio | `SCH:3115-3131` |
| Editore | `GS_LIB_TextBox_editore_dett` | `editore` | testo max 50; obbligatorio; idem ingrandimento | `SCH:3078-3105` |
| Prezzo | `GS_LIB_DoubleTextBox_prezzo_dett` | `prezzo` | numerico 3 decimali (`#,##.000`); obbligatorio ≠ 0 | `SCH:3226-3252`, `SCH:1443` |
| New | `GS_LIB_TextBox_na_dett` | `nuova_adozione` | sola lettura; **click alterna SI/NO** (vuoto→NO) | `SCH:3042-3068`, `SCH:1742-1756` |
| Acq. | `GS_LIB_TextBox_acq_dett` | `da_acquistare` | come sopra | `SCH:3006-3032`, `SCH:1758-1772` |
| Cons | `GS_LIB_TextBox_cons_dett` | `cons` (consigliato) | come sopra | `SCH:2970-2996`, `SCH:1774-1788` |
| *(pulsante)* «Importa OnLine» | `CButton_importa` | — | scarica i libri adottati per la classe dal Ministero (§3.5) | `SCH:2948-2960`, `SCH:1856-1895` |

**Griglia di dettaglio** (`SCH:1382-1456`): sola lettura, ordinata per `codice_volume`; colonne visibili e larghezze: Nr (30), Materia (140), Cod.Volume (130, evidenziata), Autori (200), Titolo (300), Vol. (40), Editore (130), Prezzo (78, `#,##.000`), New (43), Acq. (43), Cons (43). Nascoste: `key_key`, `keykey_testata`, `anno_testata`, `codice_scuola_testata`, `classe_testata`, `data_testata`, colonne di audit.

### 2.3 Griglia «Elenco» della testata (`SCH:938-987`)

Colonne: Data (100), Tipo Scuola (200), Classe, Corso, Anno, Nominativo, Indirizzo, CAP, Città, Provincia (200 ciascuna), Totale (100, valuta con `.` migliaia e `,` decimali). Nascoste: `key_key`, audit e **anche `codice_scuola`** (vedi §7).

### 2.4 Pulsanti / menu e comportamento

| Pulsante | Effetto in questa sezione |
|---|---|
| Nuovo (toolbar) | nuova testata: data = adesso, anno = anno della data, focus su Codice Scuola (`SCH:482-491`) |
| Registra (toolbar) | salva la testata con validazioni (§3.1) |
| Elimina (toolbar) | doppia conferma, cancella testata **e tutti i suoi libri** (§3.2) |
| Cerca / Applica / Annulla | ricerca per esempio; sbloccano/bloccano la data (`SCH:536-585`) |
| Elenco | griglia elenco (§2.3) |
| Refresh, Primo/Prec./Succ./Ultimo | standard GS_LIB |
| Stampa | **disattivata**: l'override restituisce `""` senza stampare (`SCH:642-649`) |
| Duplica | non fa nulla (base vuota `F01:1467-1470`) |
| Aggiungi / Registra / Elimina (griglia) | CRUD riga libro (§3.3) |
| Importa OnLine (testata) | anagrafica scuola dal MIUR (§3.4) |
| Importa OnLine (dettaglio) | libri della classe dal MIUR (§3.5) |

---

## 3. Flussi

All'apertura (`SCH:750-781`): connessione con server/database/utente/password presi dal form padre (MDI); dataset testata = `SELECT Schede_Testata.* FROM Schede_Testata WHERE Schede_Testata.key_key < 0 ORDER BY data, codice_scuola` → **si apre vuoto**, si lavora con Cerca/Applica. Utente di audit fisso `aggiornamento_utente_nome = "gigisoft"`, `key_key = 0` (`SCH:752-753`).

Quando cambia la testata corrente (`SCH:783-804`) la griglia ricarica: `SELECT ROW_NUMBER() OVER(ORDER BY codice_volume) AS Nr, Schede_Dettaglio.* FROM Schede_Dettaglio WHERE keykey_testata = <key_key> ORDER BY codice_volume` (`SCH:1457-1474`).

### 3.1 Nuova testata / modifica testata

1. Nuovo → riga nuova, data = adesso, anno = `Year(data)` (`SCH:486-487`).
2. L'utente digita Codice Scuola; all'uscita dal campo, se «Scuola» è vuoto, cerca un'altra scheda con lo stesso codice e copia corso, tipo, nominativo, indirizzo, CAP, città, provincia dalla prima trovata (§3.4). In alternativa «Importa OnLine».
3. Registra → validazioni in ordine (`SCH:810-906`):
   - **Unicità** (anno_scolastico, codice_scuola, classe, corso): in inserimento `SELECT COUNT(*) FROM schede_testata WHERE anno_scolastico = <anno> AND codice_scuola = '<cod>' AND classe = '<classe>' AND corso = '<corso>'`; in modifica la stessa con `AND key_key <> <key>`. Se > 0 → «scheda già inserita» (`SCH:820-833`, `SCH:857-873`). Nota: il controllo in inserimento scatta solo se `Record_Trovati > 0` (vedi §7).
   - Codice Scuola, Classe e Anno obbligatori («Inserire Codice Scuola», «Inserire Classe», «Inserire Anno»).
   - Corso, Tipo, anagrafica: facoltativi.
4. Salvataggio generico GS_LIB con colonne di audit (§2.0).

### 3.2 Cancellazione testata

Doppia conferma (base). Prima della DELETE della testata: `DELETE Schede_Dettaglio WHERE keykey_testata = <key_key>` (`SCH:1169-1176`, chiamato da `F01:1270-1276`). Nessun controllo su Clienti che hanno già copiato quei libri (le copie in `Cliente_Dettaglio` restano: non c'è FK, vedi §6).

### 3.3 Righe libro (dettaglio)

- **Autocompletamento da ISBN** (`SCH:1790-1823`): uscendo da Cod.Volume, `SELECT Schede_Dettaglio.* FROM Schede_Dettaglio WHERE codice_volume = '<isbn>' ORDER BY data_testata DESC`; se trova righe, copia dalla **più recente (di qualsiasi scuola/classe)** materia, autori, titolo, volume, editore, prezzo, New, Acq., Cons. Quindi `Schede_Dettaglio` fa anche da «catalogo» dei libri.
- **Aggiungi** (`SCH:1199-1227`, verifiche `SCH:1267-1380`):
  1. richiede una testata corrente;
  2. obbligatori: codice, materia, autore, titolo, volume, editore, prezzo ≠ 0 (messaggi «Inserire …», `SCH:1284-1338`);
  3. New/Acq./Cons vuoti → «NO» (`SCH:1339-1350`);
  4. ISBN non già presente nella stessa testata: `SELECT * FROM Schede_Dettaglio WHERE keykey_testata = <key> AND codice_volume = '<isbn>'` → «Codice … già inserito» (`SCH:1354-1380`);
  5. INSERT con `keykey_testata`, **copia denormalizzata** di `anno_testata`, `codice_scuola_testata`, `classe_testata`, `data_testata` dalla testata, più i campi del libro;
  6. ricarica griglia, ricalcola totale, salva il dataset della testata (`GS_LIB_FORM_01_Update_Dataset` → `F01:1915-1934`), quindi `totale` viene scritto su `Schede_Testata` [IPOTESI: dipende dal fatto che il binding abbia già spinto il valore nella riga; il flusso di import invece chiama esplicitamente Registra testata].
- **Registra riga** (modifica, dopo doppio click) (`SCH:1178-1197`): stessi obbligatori, unicità ISBN escludendo la riga stessa (`AND key_key <> <key riga>`), riscrive anche le colonne `*_testata` con i valori attuali della testata, ricalcola totale.
- **Elimina riga** (`SCH:1161-1167`, `SCH:1229-1248`): doppia conferma, DELETE riga, ricalcolo totale.
- **Totale** (`SCH:1607-1616`): `totale = Σ prezzo` delle righe caricate. Nessuna quantità, nessuno sconto, nessun filtro sui flag (anche i «Cons»/non da acquistare entrano nel totale).

### 3.4 Anagrafica scuola

**a) Dalle schede esistenti** (`SCH:1825-1854`): solo se Codice Scuola è pieno e «Scuola» vuoto: `SELECT codice_scuola, tipo_scuola, classe, corso, anno_scolastico, nominativo_scuola, indirizzo_scuola, cap_scuola, citta_scuola, provincia_scuola FROM Schede_Testata WHERE codice_scuola = '<cod>' ORDER BY codice_scuola` → copia dalla prima riga corso, tipo, nominativo, indirizzo, CAP, città, provincia. Non esiste quindi una tabella anagrafica scuole: l'anagrafica è ripetuta su ogni testata.

**b) Online dal Ministero** («Importa OnLine» della testata, `SCH:2267-2324`): se Codice Scuola è pieno, GET su
`https://dati.istruzione.it/opendata/SCUANAGRAFESTAT/query?query=<SPARQL>&dataType=csv` con `SELECT DISTINCT ?codicescuola ?denominazionescuola ?tiposcuola ?anno ?indirizzo ?cap ?comune ?provincia` sui predicati `miur:CODICESCUOLA`, `DENOMINAZIONESCUOLA`, `DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA`, `ANNOSCOLASTICO`, `INDIRIZZOSCUOLA`, `CAPSCUOLA`, `DESCRIZIONECOMUNE`, `PROVINCIA`, `FILTER(?codicescuola = "<cod>")`, `LIMIT 1000`. Il CSV (CsvHelper, separatore `,`) viene messo nei campi: Scuola ← denominazione, Tipo Scuola ← tipologia grado istruzione, Indirizzo, CAP, Città ← comune, Provincia; **Corso viene svuotato**. Non salva: serve poi Registra. Se arrivano più righe (es. più anni) vince l'ultima. Il campo `anno` letto non viene usato.

### 3.5 Import libri adottati dal Ministero («Importa OnLine» del dettaglio)

`SCH:1856-1895` + `SCH:2146-2265`.

1. Prende dalla testata corrente `key_key`, `anno_scolastico`, `codice_scuola`, `classe`; costruisce `data_testata` come stringa `yyyyMMdd HH:mm:ss.<ms>` dalla data della testata.
2. Divide la classe: **anno_corso = primo carattere**, **sezione = il resto** (es. «3B» → 3, «B»).
3. Rifiuta (ritorna «ko» silenziosamente) se si è in Nuovo/Cerca o non c'è record corrente (`SCH:2171-2178`).
4. GET su `https://dati.istruzione.it/opendata/ALTCAMPANIA/query?query=<SPARQL>&dataType=csv`: `SELECT DISTINCT ?autori ?tipogradoscuola ?codicescuola ?codiceisbn_isbn ?annocorso ?editore ?daacquist ?combinazione ?consigliato ?titolo ?codiceisbn ?prezzo ?sezioneanno ?volume ?sottotitolo ?disciplina ?nuovaadoz` con `FILTER(?codicescuola = "<cod>" && ?annocorso = <n> && ?sezioneanno = "<sez>")`, `LIMIT 1000` (`SCH:2179`). Il dataset «ALTCAMPANIA» è, dal nome, quello delle adozioni libri **della Campania** [IPOTESI sul significato del nome; il codice non filtra per anno scolastico: prende ciò che il Ministero pubblica in quel momento].
5. Per ogni riga CSV: se non esiste già `SELECT COUNT(*) FROM schede_dettaglio WHERE keykey_testata = <key> AND anno_testata = <anno> AND codice_scuola_testata = '<cod>' AND codice_volume = '<isbn>'` (`SCH:2222-2225`), esegue
   `INSERT INTO Schede_Dettaglio (keykey_testata, anno_testata, codice_scuola_testata, classe_testata, data_testata, codice_volume, materia_disiplina, autori, titolo, volume, editore, prezzo, nuova_adozione, da_acquistare, cons)` (`SCH:2216-2247`) con la mappatura:

   | CSV MIUR | Colonna `Schede_Dettaglio` |
   |---|---|
   | `codiceisbn` | `codice_volume` |
   | `disciplina` | `materia_disiplina` |
   | `autori`, `titolo`, `volume`, `editore` | omonime |
   | `prezzo` (primo pezzo prima di `","`, virgola → punto) | `prezzo` |
   | `nuovaadoz` | `nuova_adozione` |
   | `daacquist` | `da_acquistare` |
   | `consigliato` | `cons` |
   | — (scartati) | `sottotitolo`, `combinazione`, `tipogradoscuola`, `codiceisbn_isbn` |

   Righe già presenti **non vengono aggiornate** (prezzo o flag cambiati dal Ministero restano vecchi).
6. Ricarica griglia, ricalcola totale, **Registra la testata** (salva `totale`) (`SCH:2255-2257`).
7. I valori dei flag arrivano come li scrive il Ministero (non normalizzati a «SI»/«NO») [DA VERIFICARE il formato reale, es. «Si»/«No»].

### 3.6 Effetti su altre tabelle

- Nessun effetto su Magazzino, giacenze, ordini o bolle da questa sezione: scrive solo `Schede_Testata` e `Schede_Dettaglio`.
- Le altre sezioni **leggono** queste tabelle (§6).

---

## 4. Tabelle DB toccate

### 4.1 `Schede_Testata` (una riga = una classe di una scuola in un anno)

| Colonna | Tipo probabile | Significato | Rif. |
|---|---|---|---|
| `key_key` | bigint IDENTITY [IPOTESI] | PK | `SCH:775`, `F01:1060-1070` |
| `data` | datetime | data/ora di creazione scheda | `SCH:3948` |
| `anno_scolastico` | int (numerico) | anno, impostato all'anno solare della data | `SCH:3867`, `SCH:487` |
| `codice_scuola` | varchar(50) | codice meccanografico MIUR | `SCH:3778` |
| `tipo_scuola` | varchar(50) | tipologia/grado (dal MIUR) | `SCH:3692` |
| `classe` | varchar(50) | anno di corso + sezione (es. «1A») | `SCH:3735` |
| `corso` | varchar(50) | testo libero | `SCH:3822` |
| `nominativo_scuola`, `indirizzo_scuola`, `cap_scuola`, `citta_scuola`, `provincia_scuola` | varchar(50) | anagrafica scuola denormalizzata | `SCH:3477-3664` |
| `totale` | decimal/money | Σ prezzo dei libri | `SCH:2870` |
| `inserimento_data`, `inserimento_utente_key_key`, `inserimento_utente_nome`, `modifica_data`, `modifica_utente_key_key`, `modifica_utente_nome` | datetime / bigint o varchar / varchar | audit | `SCH:951-956`, `F01:986-1010` |

Chiave logica (controllata solo dal programma, non si sa se esiste un vincolo nel DB): (`anno_scolastico`, `codice_scuola`, `classe`, `corso`) (`SCH:826-828`).

### 4.2 `Schede_Dettaglio` (una riga = un libro adottato nella classe)

| Colonna | Tipo probabile | Significato | Rif. |
|---|---|---|---|
| `key_key` | bigint IDENTITY [IPOTESI] | PK | `SCH:1412` |
| `keykey_testata` | bigint | FK logica → `Schede_Testata.key_key` | `SCH:1206`, `SCH:1469` |
| `anno_testata` | int | copia di `anno_scolastico` | `SCH:1207`, `SCH:2229` (Convert.ToInt64) |
| `codice_scuola_testata` | varchar | copia di `codice_scuola` | `SCH:1208` |
| `classe_testata` | varchar | copia di `classe` | `SCH:1209` |
| `data_testata` | datetime | copia di `data` | `SCH:1210`, `SCH:2232` |
| `codice_volume` | varchar(50) | ISBN | `SCH:1212` |
| `materia_disiplina` | varchar(50) | materia (refuso nel nome colonna) | `SCH:1211` |
| `autori` | varchar(200) | | `SCH:3281` |
| `titolo` | varchar(200) | | `SCH:3165` |
| `volume` | varchar(50) | | |
| `editore` | varchar(50) | | |
| `prezzo` | decimal (3 decimali in UI) | prezzo di copertina | `SCH:1443` |
| `nuova_adozione` | varchar | «SI»/«NO» (o valore MIUR) | |
| `da_acquistare` | varchar | «SI»/«NO» (o valore MIUR) | |
| `cons` | varchar | consigliato «SI»/«NO» (o valore MIUR) | |
| colonne di audit | | come testata | `SCH:1416-1421` |

Unicità logica: (`keykey_testata`, `codice_volume`) (`SCH:1365-1372`). Nessuna FK dichiarata nel codice; la cancellazione a cascata è fatta dal programma (§3.2).

### 4.3 `ImportazioniLibri` e `ImportazioniScuole` (solo codice morto)

Scritte solo da `Importa_Libri()` e `Importa_Scuole()`, **mai chiamate** (§7). Colonne dedotte dagli INSERT:
- `ImportazioniLibri` (`SCH:1948`): CODICESCUOLA, ANNOCORSO, TIPOGRADOSCUOLA, COMBINAZIONE, DISCIPLINA, CODICEISBN, AUTORI, TITOLO, SOTTOTITOLO, VOLUME, EDITORE, PREZZO, NUOVAADOZ, DAACQUIST, CONSIGLIATO (stringhe; tracciato del CSV ministeriale adozioni).
- `ImportazioniScuole` (`SCH:2040`): ANNOSCOLASTICO, AREAGEOGRAFICA, REGIONE, PROVINCIA, CODICEISTITUTORIFERIMENTO, DENOMINAZIONEISTITUTORIFERIMENTO, CODICESCUOLA, DENOMINAZIONESCUOLA, INDIRIZZOSCUOLA, CAPSCUOLA, CODICECOMUNESCUOLA, DESCRIZIONECARATTERISTICASCUOLA, DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA, INDICAZIONESEDEDIRETTIVO, INDICAZIONESEDEOMNICOMPRENSIVO, INDIRIZZOEMAILSCUOLA, INDIRIZZOPECSCUOLA, SITOWEBSCUOLA, SEDESCOLASTICA (tracciato anagrafe scuole statali).

[DA VERIFICARE] se queste tabelle esistono nel DB MIKE e se contengono dati caricati in passato (magari con un altro strumento).

### 4.4 Tabelle lette da altre sezioni a partire da queste

`Cliente_Testata` / `Cliente_Dettaglio` (sezione Clienti), vedi §6.

---

## 5. Stampe / export

- **Nessuna stampa attiva**: `GS_LIB_Button_Stampa` è sovrascritto e ritorna `""` per il dataset corrente (`SCH:642-649`); `GS_LIB_File_Report` non è mai impostato in questo form; nessun `.rpt` referenziato nel progetto.
- `GS_MAG_SCHEDE_STAMPE` (`STP`) è una finestrina con «Stampa 1», «Stampa 2», «Stampa 3», «ANNULLA» che imposta solo `scelta` = 1/2/3/0 e si chiude (`STP:23-45`); titolo «Stampa Ordini». **Non è mai istanziata** da nessun file (grep su tutto `src/`).
- **Nessun export** CSV/Excel.
- **Import** (vedi §3.4, §3.5, §7): solo online da dati.istruzione.it; i vecchi import da file `libri.csv`, `scuole.csv` (cartella di lavoro) e `C:\LAV\MIKE\filecsvministero\gigi.csv` sono codice morto.

---

## 6. Collegamenti con le altre sezioni

| Sezione | Collegamento | Rif. |
|---|---|---|
| Menu | pulsante «schede» → `Apri_Schede(...)`; i parametri non vengono usati | `MENU:360-381` |
| **Clienti** (`GS_MAG_SCHEDE_CLIENTE`) | in registrazione della scheda cliente: `SELECT COUNT(classe) FROM Schede_Testata WHERE anno_scolastico = … AND codice_scuola = … AND classe = …`; se 0 → «Classe inesistente. Registrare lo stesso ?» | `CLI:798-801`, `CLI:844-847` |
| Clienti | copia dei libri: `INSERT INTO Cliente_Dettaglio (...) SELECT … FROM Schede_Dettaglio WHERE anno_testata = … AND codice_scuola_testata = … AND classe_testata = … [AND keykey_testata = <key_key testata trovata con anno+scuola+classe+corso>] AND codice_volume NOT IN (righe già del cliente con quel barcode)`, con stati iniziali confermato/ordinato/arrivato/consegnato = «NO» | `CLI:2137-2176` |
| Clienti | stessa autocompilazione anagrafica scuola da `Schede_Testata` e libro da `Schede_Dettaglio` per ISBN | `CLI:2178-2240` |
| **Ordini** (`GS_MAG_SCHEDE_ORDINE`) | autocompilazione riga per ISBN da `Schede_Dettaglio` (`ORDER BY data_testata DESC`) | `GS_MAG_SCHEDE_ORDINE/GS_MAG/GS_MAG_SCHEDE_ORDINE.cs:2206-2215` |
| **Magazzino** (`GS_MAG_MAGAZZINO`) | contiene una griglia di dettaglio su `Schede_Dettaglio` copiata da questo form, tenuta nascosta [IPOTESI: residuo di copia-incolla; da confermare nell'inventario Magazzino] | `GS_MAG_MAGAZZINO/GS_MAG/GS_MAG_MAGAZZINO.cs:1205-1272, 646, 2586` |
| **Bolle** | nessun riferimento diretto a `Schede_*` | grep |

In sintesi: Schede = **listino adozioni per classe**; Clienti lo usa come modello per prenotare i libri dell'alunno; ordini/bolle/magazzino lavorano poi sulle righe cliente.

---

## 7. Stranezze, codice morto, bug, valori cablati

**Da NON copiare:**
1. **Stringa di connessione cablata** con server `BAMBù\SQLEXPRESS`, database MIKE e credenziali di un utente amministratore del DB in chiaro (`SCH:159`), usata da import (`SCH:1951, 2043, 2219`) invece della connessione dell'applicazione. Credenziali non riportate qui; **vanno ruotate**.
2. **SQL costruito per concatenazione** con valori digitati dall'utente in tutte le query (`SCH:826-868`, `1174`, `1365-1371`, `1795`, `1829`, `2222-2224`): SQL injection e rottura con apostrofi (es. «Sant'Anna»).
3. **Codice morto**: `Importa_Libri()` (`SCH:1897-1978`, legge `libri.csv` relativo alla cartella di lavoro), `Importa_Scuole()` (`SCH:1980-2074`, `scuole.csv`), `Importa_Libri2()` (`SCH:2076-2144`, percorso cablato `C:\LAV\MIKE\filecsvministero\gigi.csv` e **17 MessageBox di debug per ogni riga**). Nessuno è chiamato. Classi `MyClassLibri`/`MyClassScuole` usate solo da questi.
4. `GS_MAG_SCHEDE_STAMPE` mai usato (§5).
5. `tabPage_1` con campi non legati a nulla e copiati da un'altra anagrafica: Iban, Agenzia, Banca, Codice Fiscale, P.Iva, EMail 1-3, Cellul., Telefono, Provincia, CAP, Città, Indirizzo, Nome, Cognome, Tipologia, Data Accettazione, Numero, combo `GS_LIB_ComboBoxAdv_articolo_taglia` (`SCH:3980-5001`). [DA VERIFICARE] se la tab è visibile all'utente.
6. `GS_MAG_SCHEDE_Paint` gestisce chiamate «fornitori»/«articoli» → `caller_flag`/`caller_mem` mai letti (`SCH:701-742`): copia-incolla.
7. Etichetta orfana «codice» (`gradientLabel1`, `SCH:2753`), `flag_ricerca_cod_colume` impostato e mai letto (`SCH:1792,1820`), stile per la colonna `codice_volume` nella griglia elenco della testata, che non ha quella colonna (`SCH:1001,1018`).
8. Utente di audit cablato «gigisoft» con id 0 (`SCH:752-753`): l'audit non identifica chi ha lavorato.

**Bug evidenti / comportamenti dubbi:**
9. **Anno scolastico = anno solare** della data di creazione (`SCH:487`): una scheda creata a gennaio 2027 per l'a.s. 2026/27 avrebbe anno 2027. [DA CHIARIRE] convenzione voluta.
10. **Controllo duplicati in inserimento solo se `Record_Trovati > 0`** (`SCH:820`): poiché il form si apre vuoto (`key_key < 0`), al primo Nuovo senza aver fatto una ricerca il controllo «scheda già inserita» probabilmente non scatta [IPOTESI forte: dipende da come GS_LIB aggiorna `Record_Trovati` dopo AddNew].
11. Griglia elenco: `HeaderText` «Codice Scuola» messo per errore su `tipo_scuola` e poi sovrascritto; `codice_scuola` ha larghezza 0 → **il codice scuola non si vede nell'elenco** (`SCH:960-963`).
12. Import libri: millisecondi di `data_testata` non riempiti con zeri (5 ms → «.5» = 500 ms) (`SCH:1888-1889`); `classe.Substring(0,1)` presuppone anno di corso a una cifra e sezione subito dopo (classi tipo «1 A», «IA», «1A LIC» darebbero filtri sbagliati) (`SCH:1892-1893`).
13. Import libri: cattura solo `OleDbException` (`SCH:2260`), ma usa `WebRequest` e `SqlConnection`: errori di rete o SQL fanno **crashare** l'applicazione. Import scuola: nessuna gestione errori (`SCH:2267-2315`).
14. Import libri: il controllo «già presente» usa anche `anno_testata` e `codice_scuola_testata`, ma l'unicità manuale usa solo testata+ISBN: incoerente ma innocuo. Le righe già presenti **non vengono aggiornate** e quelle tolte dal Ministero **non vengono rimosse**.
15. Import libri: `LIMIT 1000` e nessun filtro per anno scolastico; dataset regionale `ALTCAMPANIA` cablato (`SCH:2179`). Prezzo: split su `","` e sostituzione virgola→punto (`SCH:2206, 2239-2242`): hack sul formato CSV [DA VERIFICARE con un CSV reale].
16. Import scuola: svuota «Corso» (`SCH:2300`) e prende l'ultima riga se il Ministero ne restituisce più d'una; dataset `SCUANAGRAFESTAT` = solo scuole statali [IPOTESI: le paritarie stanno in un altro dataset MIUR e non verrebbero trovate].
17. Flag SI/NO: inseriti a mano come «SI»/«NO», dall'import come arrivano dal Ministero (possibile «Si»/«No» o altro) → valori misti nella stessa colonna.
18. Autocompletamento ISBN copia anche i flag New/Acq./Cons dall'ultima scheda di **un'altra scuola** (`SCH:1817-1819`): probabilmente non voluto.
19. Totale = Σ prezzo senza considerare «da acquistare» o «consigliato» (`SCH:1607-1616`).
20. Colonne denormalizzate (`anno_testata`, `codice_scuola_testata`, `classe_testata`, `data_testata`) aggiornate solo quando si salva **la riga**: se si modifica la testata (es. classe) le righe esistenti restano con i valori vecchi, e Clienti filtra proprio su quelle (`CLI:2160-2163`) → copie mancate.
21. Nome colonna con refuso `materia_disiplina`: nel nuovo schema va normalizzato (mappare in migrazione).

---

## 8. Domande aperte per il negoziante

1. «Anno» della scheda: è l'anno di inizio dell'anno scolastico (2026 per il 2026/27)? Cosa fate per le schede create a inizio anno solare?
2. Che cosa scrivete nel campo **Corso** (indirizzo di studio, sezione, plesso)? Due classi uguali con corsi diversi sono davvero schede diverse?
3. Come scrivete la **classe** (sempre «1A»? anche «1 A», «IA», con indirizzo)? L'import online dipende da questo formato.
4. Usate davvero «Importa OnLine» per libri e scuole? Lavorate solo con scuole della **Campania** e solo statali, o anche paritarie/altre regioni?
5. Quando il Ministero cambia prezzo o adozioni dopo l'import, come aggiornate le schede? Vi servirebbe un «riallinea» che aggiorna/rimuove?
6. Significato operativo di **New** (nuova adozione), **Acq.** (da acquistare) e **Cons** (consigliato): influenzano cosa prenota il cliente o il prezzo? Il totale scheda deve includere i libri non da acquistare/consigliati?
7. Il **Totale** della scheda lo usate (es. preventivo alla famiglia)? Con o senza sconti?
8. Vi serve una **stampa** della scheda classe (oggi il pulsante non fa nulla)? Esisteva in passato un report?
9. L'autocompletamento per ISBN copia i dati dall'ultima scheda di qualsiasi scuola, flag compresi: va bene o i flag dovrebbero partire da «NO»?
10. Cancellando una scheda classe, cosa deve succedere alle prenotazioni dei clienti già copiate da quella scheda?
11. La seconda scheda con i campi Iban/Banca/Codice Fiscale/Email compare nel programma? Serve a qualcosa?
12. Avete mai caricato file CSV del Ministero (`libri.csv`, `scuole.csv`, tabelle `ImportazioniLibri`/`ImportazioniScuole`)? Ci sono dati lì da migrare?
13. Più persone usano il programma? (oggi l'audit registra sempre «gigisoft»).
