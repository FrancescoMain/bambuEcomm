# Inventario funzionale — sezione ORDINI (GS_MAG_SCHEDE_ORDINE)

Sorgenti analizzati (decompilati ILSpy, percorsi relativi a `scratchpad/src/`):

- `GS_MAG_SCHEDE_ORDINE/GS_MAG/GS_MAG_SCHEDE_ORDINE.cs` (abbreviato **ORD**)
- `GS_MAG_SCHEDE_ORDINE/GS_MAG/GS_MAG_SCHEDE_ORDINE_STAMPE.cs` (abbreviato **STP**)
- `GS_LIB/GS_LIB/GS_LIB_FORM_01.cs` (abbreviato **LIB**), `GS_LIB/GS_LIB/GS_LIB_Grid_00.cs` (abbreviato **GRID**)
- Per i collegamenti: `GS_MAG_SCHEDE_BOLLA/GS_MAG/GS_MAG_SCHEDE_BOLLA.cs` (**BOL**), `GS_MAG_SCHEDE_CLIENTE/GS_MAG/GS_MAG_SCHEDE_CLIENTE.cs` (**CLI**), `GS_MAG/GS_MAG/GS_MAG_MENU.cs` (**MENU**)

Convenzione: tutto ciò che non è letto direttamente nel codice è marcato **[SUPPOSIZIONE]** o **[DA VERIFICARE]**.

---

## 1. Scopo della sezione

La «Scheda Ordini» registra gli ordini che la cartoleria fa al fornitore/distributore per i libri scolastici prenotati dai clienti. Un ordine (testata `Ordine_Testata`) contiene una riga (`Ordine_Dettaglio`) **per ogni copia** da ordinare: le righe nascono quasi sempre importando le prenotazioni dei clienti già confermate e non ancora ordinate (vista `Codici_Da_Ordinare_View` su `Cliente_Dettaglio`), che vengono marcate «ordinato = SI» con il numero d'ordine. L'arrivo della merce e la consegna al cliente **non** si registrano qui ma nelle sezioni Bolle e Clienti, che aggiornano gli stessi flag su `Ordine_Dettaglio`.

Apertura: pulsante «Scheda Ordini» del menu principale → `Apri_OrdineSchede` (MENU:407-430). Titolo finestra «SCHEDE ORDINI» (ORD:664, ORD:679).

---

## 2. Schermata

### 2.1 Come funziona il form (meccanica GS_LIB, utile per capire il resto)

- Il form eredita da `GS_LIB_FORM_01` (ORD:19). Ogni controllo `GS_LIB_*` ha le proprietà `GS_LIB_Tabella`, `GS_LIB_Colonna`, `GS_LIB_Indice` (es. `"0000"` = connessione 00 / dataset 00 = testata; `"0010"` = connessione 00 / dataset 10 = dettaglio), `GS_LIB_Ricerca_Abilitata`, `GS_LIB_Ricerca_Tipo`, `GS_LIB_Prossimo_Controllo` (tab order). Il binding colonna↔controllo è fatto per riflessione da `GS_LIB_Bind` (LIB:2002) e la ricerca da `GS_LIB_Make_Sql` (LIB:3700).
- Dataset usati: `[0,0]` = `Ordine_Testata` (ORD:689-695); `[0,10]` = `Ordine_Dettaglio` (ORD:1377-1383); `[0,11]` = `Codici_Da_Ordinare_View` (ORD:1809-1815); `[0,15]` = stessa vista, per «Aggiungi Tutti» (ORD:2254-2267); `[0,2]` = `Schede_Dettaglio` per l'autocompletamento del codice (ORD:2211-2224).
- All'apertura la testata viene caricata con `where Ordine_Testata.key_key < 0` (ORD:691), cioè **vuota**: l'utente deve fare Cerca → Applica (o Nuovo). Ordinamento: `ORDER BY data asc, ordine_progressivo desc` (ORD:692).
- Utente di audit cablato: `aggiornamento_utente_key_key = 0`, `aggiornamento_utente_nome = "gigisoft"` (ORD:670-671); la libreria scrive `inserimento_*`/`modifica_*` su ogni insert/update (LIB:968-993).

### 2.2 Testata (tabPage_0, dataset [0,0], tabella `Ordine_Testata`)

| Etichetta a video | Controllo | Colonna DB | Tipo probabile | Note |
|---|---|---|---|---|
| Numero | `gS_LIB_DoubleTextBox_ordine_progressivo` | `ordine_progressivo` | int/numeric | Sola lettura (ORD:3547); calcolato al «Nuovo» (ORD:380-383); editabile solo in modalità Cerca (ORD:422, ORD:459, ORD:478). Ricerca `>=` numerica |
| Data | `GS_LIB_DateTimePickerAdv_data` | `data` | datetime | Sola lettura (ORD:4591); al «Nuovo» = `DateTime.Now` con ora (ORD:378). Ricerca `>=` |
| Anno | `GS_LIB_DoubleTextBox_anno` | `anno_scolastico` | int | Editabile; al «Nuovo» = anno solare di oggi (ORD:379). Ricerca `=` (ORD:4510). Obbligatorio in immissione (ORD:792-797, vedi §7) |
| Barcode | `gS_LIB_TextBox_ordine_barcode` | `ordine_progressivo_barcode` | varchar(13) | Sola lettura (ORD:3411); calcolato a ogni salvataggio = anno + progressivo a 9 cifre con zeri (ORD:748-751) |
| Cod. | `gS_LIB_TextBox_ordine_fornitore_codice_fiscale` | `ordine_fornitore_codice_fiscale` | varchar | Obbligatorio: «Inserire Codice Fiscale» (ORD:759-764). Ricerca LIKE 'x%' |
| Ragione Soc. | `gS_LIB_TextBox_ordine_fornitore_cognome` | `ordine_fornitore_cognome` | varchar | Obbligatorio: «Inserire Codice Cognome» (ORD:765-770) |
| Nominativo | `gS_LIB_TextBox_ordine_fornitore_nome` | `ordine_fornitore_nome` | varchar | Obbligatorio: «Inserire Codice Nome» (ORD:771-776) |
| Totale (in basso) | `gS_LIB_DoubleTextBox_totale` | `totale` | decimal/float | Ricalcolato = somma `prezzo` di tutte le righe del dettaglio (ORD:1775-1784) |
| (nessuna, controllo minuscolo 63×13) | `gS_LIB_DoubleTextBox_key_key` | `key_key` | int, PK | Usato da `Importa` come chiave testata (ORD:2175) |

Etichette/posizioni: ORD:3593-3597 (Numero), 4540-4544 (Data), 4530-4534 (Anno), 3376-3380 (Barcode), 3420-3424 (Cod.), 3507-3511 (Ragione Soc.), 3463-3467 (Nominativo), 3603-3607 (Totale). Il fornitore è **testo libero** in testata: non c'è alcuna tabella Fornitori né lookup (vedi §7).

### 2.3 Griglia «da ordinare» (`GS_LIB_GRID_002`, dataset [0,11])

Visibile solo se l'ordine corrente è salvato (non in immissione/ricerca) **e** la vista contiene righe (ORD:708-723). Sorgente: `SELECT ROW_NUMBER() OVER(ORDER BY codice_volume) AS Nr, Codici_Da_Ordinare_View.* FROM Codici_Da_Ordinare_View ORDER BY codice_volume asc`, **senza filtro** (ORD:1809-1815, 1836-1843). Non editabile (ORD:1816).

| Colonna | Intestazione | Larghezza/formato |
|---|---|---|
| `Nr` | (Nr) | colonna colorata beige/arancio (ORD:1891-1897, 1933-1934) |
| `codice_volume` | Cod.Volume | 130 (ORD:1818-1819) |
| `titolo` | Titolo | 300 (ORD:1820-1821) |
| `quantita` | Quantita | 85, formato `#,##.000` (ORD:1822-1824) |
| `prezzo` | Prezzo | 85, formato `#,##.000` (ORD:1825-1827) |

Eventuali altre colonne della vista sono mostrate con larghezza di default **[DA VERIFICARE la definizione della vista]**.

- **Doppio clic su una riga** → `Importa(codice_volume)` per quel solo codice (ORD:1852-1873).
- Dentro il pannello della griglia ci sono tre controlli fuori area visibile (`gS_LIB_TextBox5` → `da_acquistare`, `gS_LIB_TextBox6` → `nuova_adozione`, `gS_LIB_DoubleTextBox1` → `prezzo`, tutti legati al dataset 0010 cioè `ordine_dettaglio`) (ORD:3250-3368): residuo di copia-incolla, vedi §7.

### 2.4 Pulsanti accanto alla griglia «da ordinare»

| Pulsante | Controllo | Azione |
|---|---|---|
| **Esporta csv** | `cButton_esporta` (ORD:3195-3207) | `ExportToCsv()` → file `C:\BAMBU\ordini_csv\<Numero>_ordini.csv` con le righe **della griglia da ordinare** (ORD:2290-2308). Vedi §5 |
| **Aggiungi Tutti** | `cButton_aggiungi_tutti` (ORD:3234-3246) | Rilegge la vista e chiama `Importa` per ogni `codice_volume` (ORD:2252-2288) |

Entrambi visibili solo se la vista ha righe (ORD:714-722).

### 2.5 Dettaglio ordine (`GS_LIB_GRID_001`, dataset [0,10], tabella `Ordine_Dettaglio`)

Titolo del pannello: «Dettaglio Scheda Cliente» (ORD:3691 — etichetta copiata dal form Clienti). Sorgente: `SELECT ROW_NUMBER() OVER(ORDER BY codice_volume) AS Nr, Ordine_Dettaglio.* FROM Ordine_Dettaglio WHERE keykey_testata = <key_key testata> ORDER BY codice_volume asc` (ORD:1462-1469). Griglia non editabile in cella (ORD:1384): si modifica tramite la riga di campi sopra la griglia.

Colonne visibili (ORD:1400-1421):

| Colonna DB | Intestazione | Larghezza |
|---|---|---|
| `Nr` | Nr | 30 — cella colorata secondo lo stato (vedi legenda) |
| `materia_disiplina` | Materia | 140 |
| `codice_volume` | Cod.Volume | 130 |
| `autori` | Autori | 200 |
| `titolo` | Titolo | 300 |
| `volume` | Vol. | 40 |
| `editore` | Editore | 130 |
| `prezzo` | Prezzo | 78, formato `#,##.000` |
| `nuova_adozione` | New | 43 |
| `da_acquistare` | Acq. | 43 |
| `cons` | Cons | 43 |

Colonne nascoste (larghezza 0): `inserimento_*`, `modifica_*`, `key_key`, `keykey_testata`, `anno_testata`, `codice_scuola_testata`, `classe_testata`, `data_testata`, `progressivo_testata`, `barcode`, `confermato`, `ordinato`, `arrivato`, `confermato_data`, `ordinato_data`, `arrivato_data`, `ordinato_numero`, `arrivato_numero`, `key_key_cliente_dettaglio`, `tipo`, `consegnato`, `consegnato_data` (ORD:1386-1445).

Campi di modifica della riga (dentro il pannello della griglia, dataset 0010):

| Posizione / significato | Controllo | Colonna | Note |
|---|---|---|---|
| Codice volume (ISBN) | `GS_LIB_TextBox_codice_dett` | `codice_volume` | All'uscita dal campo cerca il libro in `Schede_Dettaglio` e precompila gli altri campi (ORD:2206-2239) |
| Materia | `GS_LIB_TextBox_materia_dett` | `materia_disiplina` | Freccia giù allarga il campo a 300×100, freccia su lo rimpicciolisce (ORD:1961-1990) |
| Autori | `GS_LIB_TextBox_autore_dett` | `autori` | idem (ORD:1992-2021) |
| Titolo | `GS_LIB_TextBox_titolo_dett` | `titolo` | idem (ORD:2023-2052) |
| Volume | `GS_LIB_TextBox_volume_dett` | `volume` | |
| Editore | `GS_LIB_TextBox_editore_dett` | `editore` | idem (ORD:2054-2083) |
| Prezzo | `GS_LIB_DoubleTextBox_prezzo_dett` | `prezzo` | 3 decimali a video |
| New | `GS_LIB_TextBox_na_dett` | `nuova_adozione` | Sola lettura; clic alterna NO/SI (ORD:2085-2099) |
| Acq. | `GS_LIB_TextBox_acq_dett` | `da_acquistare` | Sola lettura; clic alterna NO/SI (ORD:2101-2115) |
| Cons | `GS_LIB_TextBox_cons_dett` | `cons` | Sola lettura; clic alterna NO/SI (ORD:2117-2131) |
| flag Confermato | `GS_LIB_TextBox_confermato_dett` | `confermato` | Sola lettura, 21×18 (ORD:3934-3958) |
| flag Ordinato | `GS_LIB_TextBox_ordinato_dett` | `ordinato` | Sola lettura (ORD:3899-3923) |
| flag «Arrivato» | `GS_LIB_TextBox_arrivato_dett` | **`cons`** (!) | Bug: legato alla colonna sbagliata (ORD:3864), vedi §7 |
| Data confermato / ordinato / arrivato | `gS_LIB_DateTimePickerAdv_confermato_data` / `_ordinato_data` / `_arrivato_data` | `confermato_data` / `ordinato_data` / `arrivato_data` | Sola lettura (ORD:3741, 3795, 3849) |
| Nr, key_key, keykey_testata | `GS_LIB_DoubleTextBox_scheda_nr` / `_scheda_key_key` / `_scheda_key_key_testata` | `Nr` / `key_key` / `keykey_testata` | Tecnici, in alto a sinistra del pannello |
| Pallino di stato | `cButton_state` | — | Visibile dopo doppio clic su una riga; colore = stato (ORD:1480-1562) |

Pulsanti della griglia dettaglio (forniti da `GS_LIB_Grid_00`): **Aggiungi**, **Registra**, **Elimina** (GRID:199-232, testi GRID:400, 432, 464). Il doppio clic su una riga lega i campi alla riga e abilita Registra/Elimina; il clic singolo li scollega e riabilita solo Aggiungi (ORD:1480-1490, LIB:4666-4688).

**Etichetta informativa** `gradientLabel_info` (ORD:3162-3169): quando si seleziona una riga importata da un cliente mostra «codice_scuola, nominativo_scuola, classe, CF cliente, cognome, nome, codice_volume» con questa query (ORD:1509-1530):

```sql
select IsNull(a.codice_scuola,'') + '     ' + IsNull(a.nominativo_scuola,'') + '     ' + IsNull(a.classe,'') + '     '
     + IsNull(a.cliente_codice_fiscale,'') + '     ' + IsNull(a.cliente_cognome,'') + '     ' + IsNull(a.cliente_nome,'') + '     '
     + IsNull(c.codice_volume,'') + '     '
from Cliente_Testata a, Cliente_Dettaglio b, Ordine_Dettaglio c
where c.key_key_cliente_dettaglio = <riga> and c.key_key = <riga>
  and a.key_key = b.keykey_testata and b.key_key = c.key_key_cliente_dettaglio
```

**LEGENDA** (passando il mouse su «LEGENDA», ORD:2241-2250, pannello ORD:2925-3153) e colori della cella `Nr` / del pallino (ORD:1531-1561, 1630-1664, 1745-1760):

| Stato | Condizione | Colore |
|---|---|---|
| Non Confermato | confermato=NO, ordinato=NO, arrivato=NO | PowderBlue→SlateBlue |
| Confermato | SI / NO / NO | Giallo→Arancio |
| Ordinato | SI / SI / NO | Rosso→OrangeRed |
| Arrivato | SI / SI / SI | Lime→LimeGreen |
| Consegnato | consegnato=SI (prevale su tutto) | DodgerBlue→Ciano |

### 2.6 Toolbar standard (ribbon di GS_LIB) e cosa fa in questa sezione

| Pulsante | Comportamento |
|---|---|
| Primo / Precedente / Successivo / Ultimo | Navigazione sui record trovati (LIB:584-618); a ogni cambio record ricarica il dettaglio e la vista da ordinare (ORD:702-737) |
| **Nuovo** | Nuova testata: data = adesso, anno = anno solare, progressivo = max+1 per anno, focus su «Cod.» (ORD:374-387) |
| **Registra** | Salva la testata con le validazioni di §3.6 (LIB:945-1095) |
| **Cerca** / **Applica** | Svuota i campi, l'utente compila i filtri, Applica costruisce il WHERE (LIB:1113-1156). Regole: testi → `LIKE 'valore%'`; numeri con tipo `>=` → `colonna >= valore`; Anno → `=`; date → `>=` (LIB:3936-3980, 3984-4060, 4127-4240). Nessun filtro → tutti gli ordini (LIB:4342-4346) |
| Annulla | Annulla immissione/ricerca; rimette il Numero in sola lettura (ORD:474-481) |
| **Elimina** | Elimina la testata solo se **non ha righe**: «Esiste dettaglio / Impossibile Eliminare» (ORD:814-827); doppia conferma «CONFERMI ELIMINAZIONE ?» / «SICURO ?» (LIB:1310-1320) |
| Refresh | Rilegge il record corrente dal DB (LIB:1366-1413) |
| **Stampa** | Apre il dialogo «Stampa Ordini» con Ordinati / Arrivati / Da Ordinare / ANNULLA (ORD:538-567, STP), vedi §5 |
| Duplica | Non fa nulla (LIB:1467-1470) |
| Elenco | Mostra la griglia elenco testate (LIB:1480-1501) con impostazioni di ORD:837-886 (colonne Data, Totale e colonne «scuola» copiate dal form Clienti, vedi §7) |
| Esci, scheda prec./succ. | Standard |

---

## 3. Flussi

### 3.1 Creare un ordine (testata)

1. **Nuovo** → la libreria aggiunge una riga vuota (LIB:916-930), poi `GS_LIB_Button_Nuovo_Dopo` (ORD:374-387):
   - `data = DateTime.Now`
   - `anno_scolastico = anno solare di data` (es. 2026, **non** «2026/27»)
   - `ordine_progressivo = (select max(ordine_progressivo) from Ordine_Testata where anno_scolastico = <anno>) + 1` (se non ci sono ordini nell'anno: `max` → NULL → 0 → 1; `GS_LIB_Dbase_Calcola_Sql` restituisce 0 su errore/NULL, LIB:2612-2633)
2. L'utente compila Cod., Ragione Soc., Nominativo del fornitore.
3. **Registra** (LIB:945-1095):
   - calcola `ordine_progressivo_barcode = anno + right('000000000' + progressivo, 9)` (ORD:748-751);
   - validazioni (§3.6);
   - imposta `inserimento_*`/`modifica_*`;
   - INSERT tramite `OleDbCommandBuilder` sul DataSet;
   - rilegge il record appena inserito con `where key_key = MAX(Key_Key)` (LIB:1065-1074: `Calcola_Imm_Auto_Max` restituisce max+1, poi −1). **[SUPPOSIZIONE]** `key_key` è IDENTITY lato SQL Server, perché il codice non lo valorizza mai in insert.

### 3.2 Generare le righe dai libri «da ordinare» (flusso principale)

Prerequisito: ordine salvato e selezionato. La griglia «da ordinare» mostra il contenuto di `Codici_Da_Ordinare_View` (globale, senza filtro per fornitore/editore/anno).

- **Un codice** (doppio clic) o **tutti** («Aggiungi Tutti», ciclo su ogni `codice_volume` della vista) → `Importa(cod_vol)` (ORD:2137-2204):

  1. Costruisce un timestamp stringa `yyyyMMdd HH:mm:ss.<ms>` dalla **data della testata** (ORD:2139-2167).
  2. **INSERT…SELECT** da `Cliente_Dettaglio`, una riga d'ordine per **ogni** riga cliente (cioè per ogni copia prenotata) (ORD:2168-2193):

     ```sql
     insert into Ordine_Dettaglio
       (keykey_testata, anno_testata, codice_scuola_testata, classe_testata, data_testata, progressivo_testata, barcode,
        materia_disiplina, codice_volume, autori, titolo, volume, editore, prezzo, nuova_adozione, da_acquistare, cons,
        confermato, ordinato, arrivato, confermato_data, ordinato_data, arrivato_data,
        ordinato_numero, arrivato_numero, key_key_cliente_dettaglio, tipo)
     select <key_key testata>, anno_testata, codice_scuola_testata, classe_testata, '<ts>', <progressivo>, '<barcode testata>',
            materia_disiplina, codice_volume, autori, titolo, volume, editore, prezzo, nuova_adozione, da_acquistare, cons,
            confermato, 'SI', arrivato, confermato_data, '<ts>', arrivato_data,
            <progressivo>, arrivato_numero, key_key, 'importato'
     from Cliente_Dettaglio
     where codice_volume = '<cod>' and confermato = 'SI' and ordinato = 'NO' and arrivato = 'NO'
     ```

     Da notare: `anno_testata`, `codice_scuola_testata`, `classe_testata` vengono copiati dalla **riga cliente** (anno/scuola/classe della scheda cliente), mentre `data_testata`/`progressivo_testata`/`barcode` vengono dall'**ordine**. `prezzo` è quello della scheda cliente (prezzo di copertina **[SUPPOSIZIONE]**), non un prezzo d'acquisto.
  3. **UPDATE** delle righe cliente corrispondenti (ORD:2194-2199):

     ```sql
     update Cliente_Dettaglio set ordinato = 'SI', ordinato_data = '<ts>', ordinato_numero = <progressivo>
     where codice_volume = '<cod>' and confermato = 'SI' and ordinato = 'NO' and arrivato = 'NO'
     ```

     Le due istruzioni non sono in transazione (vedi §7).
  4. Ricarica il dettaglio, ricalcola il totale, **salva la testata** (`GS_LIB_Button_Registra(0,0)`, quindi rifà le validazioni sul fornitore) e ricarica la vista da ordinare (ORD:2200-2203).

Effetto: i codici importati spariscono dalla vista **[SUPPOSIZIONE: la vista filtra `confermato='SI' and ordinato='NO' and arrivato='NO'` raggruppando per codice_volume con `quantita = count(*)`; lo suggeriscono la WHERE identica di Importa e il fatto che dopo l'UPDATE la vista viene ricaricata]**.

### 3.3 Aggiungere una riga a mano («locale»)

1. Nella riga di campi digitare il **codice volume**; all'uscita dal campo (ORD:2206-2239):

   ```sql
   SELECT Schede_Dettaglio.* FROM Schede_Dettaglio where codice_volume = '<cod>' ORDER BY data_testata desc
   ```

   Se trova righe, precompila materia, autori, titolo, volume, editore, prezzo, nuova_adozione, da_acquistare, cons dalla **più recente** (`Schede_Dettaglio` = adozioni delle scuole **[SUPPOSIZIONE, sezione Scuole]**). Il flag `flag_ricerca_cod_colume` viene impostato ma non usato (ORD:2208, 2236).
2. **Aggiungi** (GRID:207-222) → `GS_LIB_FORM_01_Dettaglio_Controlla_Nuovo` (ORD:1056-1067):
   - campi obbligatori (§3.6);
   - codice non già presente nello stesso ordine: `SELECT * from Ordine_Dettaglio where keykey_testata = <t> and codice_volume = '<cod>'` → «Codice X già inserito» (ORD:1324-1350). Se l'ordine non ha ancora righe il controllo viene saltato (ORD:1331-1334).
3. `GS_LIB_FORM_01_Dettaglio_Nuovo_001` (ORD:1162-1197) inserisce la riga con: `keykey_testata`, `anno_testata` (dall'anno **dell'ordine**), `data_testata`, `progressivo_testata`, `barcode`, i dati libro, **`confermato='SI'`, `ordinato='SI'`, `arrivato='NO'`**, `confermato_data = ordinato_data = data testata`, `arrivato_data = valore del picker arrivato_data` (vedi §7), `tipo='locale'`. Non valorizza `codice_scuola_testata`, `classe_testata`, `ordinato_numero`, `key_key_cliente_dettaglio`.
4. Ricalcola il totale e salva il dataset testata (`GS_LIB_FORM_01_Update_Dataset`, ORD:1195-1196 → LIB:4702-4705, 1915-1934).

Una riga «locale» rappresenta **una sola copia** e, per il controllo duplicati, non si può aggiungere due volte lo stesso codice a mano nello stesso ordine.

### 3.4 Modificare una riga

`Registra` della griglia (GRID:199-205) → controlli (ORD:1024-1054):
- se `arrivato='SI'` → «Impossibile registrare / E' arrivato»;
- se `ordinato='SI'` → «Impossibile registrare / E' ordinato»;
- se `confermato='SI'` → «Impossibile registrare / E' confermato»;
- poi in `GS_LIB_FORM_01_Dettaglio_Registra` se `tipo='importato'` → «Impossibile modificare / E' importato» (ORD:979-993).

Poiché **tutte** le righe create da questa sezione nascono con `ordinato='SI'` (ORD:1185, ORD:2182), la modifica è in pratica **sempre bloccata**. Il codice di salvataggio (ORD:1134-1160, che reimposterebbe confermato/ordinato=SI, arrivato=NO, tipo=locale) è di fatto irraggiungibile.

### 3.5 Eliminare una riga / un ordine

**Riga** (GRID:224-233 → ORD:1004-1022, 1093-1123, 1199-1218):
1. Bloccata solo se `consegnato='SI'` («Impossibile eliminare / E' consegnato»). **Non** è bloccata se `arrivato='SI'`.
2. Doppia conferma «CONFERMI ELIMINAZIONE ?» → «SICURO ?».
3. Se `tipo='importato'`, rimette la prenotazione del cliente tra quelle da ordinare:

   ```sql
   update Cliente_Dettaglio set ordinato = 'NO', ordinato_data = null, ordinato_numero = null
   where key_key = <key_key_cliente_dettaglio>
   ```

   e ricarica la vista da ordinare (ORD:1097-1105). `arrivato`/`arrivato_*` del cliente non vengono toccati.
4. DELETE della riga (`GS_LIB_Button_Elimina(0,10)`, LIB:1278-1356), ricalcolo totale, salvataggio testata.

**Ordine intero** (toolbar Elimina): consentito solo se il dettaglio è vuoto (ORD:814-827). La libreria chiamerebbe anche `delete Ordine_Dettaglio where keykey_testata = <key>` (LIB:1270-1276 → ORD:1125-1132), ma arrivati lì il dettaglio è già vuoto. Nessun effetto su altre tabelle.

### 3.6 Regole e validazioni

| Regola | Dove |
|---|---|
| Testata: Cod./Ragione Soc./Nominativo fornitore obbligatori | ORD:759-776 |
| Testata: Anno obbligatorio solo in immissione **e** solo se esiste già almeno un record trovato | ORD:792-797 |
| Numerazione: `max(ordine_progressivo)+1` per `anno_scolastico` (anno solare al momento del Nuovo) | ORD:380-383 |
| Barcode = `anno` + progressivo zero-padded a 9 cifre (13 caratteri, senza cifra di controllo) | ORD:748-751 |
| Riga: obbligatori codice, materia, autore, titolo, volume, editore, prezzo ≠ 0 | ORD:1267-1308 |
| Riga: New/Acq./Cons vuoti → «NO» | ORD:1309-1320 |
| Riga: codice unico per ordine (solo in inserimento manuale) | ORD:1335-1348 |
| Totale = Σ `prezzo` di tutte le righe (qualunque stato), calcolato nel client | ORD:1775-1784 |
| Valori dei flag: stringhe `'SI'`/`'NO'` (maiuscole) | ovunque |
| `tipo` ∈ {`'importato'`, `'locale'`} | ORD:1156, 1190, 2189 |
| Stati della riga: Non confermato → Confermato → Ordinato → Arrivato → (Consegnato) | ORD:1531-1561 |

### 3.7 Conferma, arrivo merce, consegna (fuori da questa sezione)

- **Conferma**: in questa sezione non esiste un'azione «conferma ordine». `confermato` arriva già 'SI' dalla scheda cliente (filtro di Importa) o viene forzato 'SI' sulle righe locali. La conferma delle prenotazioni avviene in Clienti **[SUPPOSIZIONE]**.
- **Arrivo merce** (sezione Bolle, BOL): in una bolla, digitando il codice, si cerca la riga d'ordine con `where codice_volume = '<cod>' and confermato = 'SI' and ordinato= 'SI' and arrivato = 'NO' or tipo = 'locale' ORDER BY confermato_data asc` (BOL:2353-2358, precedenza AND/OR da verificare, §7); all'inserimento della riga bolla: `update Ordine_Dettaglio set arrivato='SI', arrivato_data=<ts>, arrivato_numero=<n. bolla> where codice_volume=... and key_key=<riga ordine>` e analogo su `Cliente_Dettaglio` (BOL:2011-2021); c'è anche una variante per codice con `confermato='SI' and ordinato='SI' and arrivato='NO'` (BOL:2335-2340). Eliminando la riga bolla, `arrivato` torna 'NO' su ordine e cliente e si decrementa `Magazzino.qta_prenotata_carico` (importato) o `qta_locale_carico` (locale) (BOL:1088-1123).
- **Consegna al cliente** (sezione Clienti, CLI): `update Ordine_Dettaglio set consegnato='SI', consegnato_data=<ts> where key_key_cliente_dettaglio='<riga cliente>'` (stesso su `Bolla_Dettaglio`) e `Magazzino.qta_prenotata_scarico + 1`; l'annullo rimette 'NO' (CLI:2295-2355).
- **Magazzino**: questa sezione **non** tocca la tabella `Magazzino` (nessun riferimento in ORD).

---

## 4. Tabelle DB toccate

### 4.1 `Ordine_Testata` (lettura/scrittura)

| Colonna | Tipo probabile | Significato | Fonte |
|---|---|---|---|
| `key_key` | int IDENTITY, PK | id testata | ORD:693, LIB:1065-1067 |
| `data` | datetime | data/ora creazione ordine | ORD:4579 |
| `anno_scolastico` | int | anno (in pratica anno solare) | ORD:4498 |
| `ordine_progressivo` | int | numero ordine nell'anno | ORD:3525 |
| `ordine_progressivo_barcode` | varchar(13) | anno+progressivo a 9 cifre | ORD:3391 |
| `ordine_fornitore_codice_fiscale` | varchar | codice/CF fornitore (etichetta «Cod.») | ORD:3435 |
| `ordine_fornitore_cognome` | varchar | ragione sociale fornitore | ORD:3565 |
| `ordine_fornitore_nome` | varchar | nominativo/referente | ORD:3478 |
| `totale` | decimal/float | somma prezzi righe | ORD:3621 |
| `inserimento_data`, `inserimento_utente_key_key`, `inserimento_utente_nome`, `modifica_data`, `modifica_utente_key_key`, `modifica_utente_nome` | datetime / int(o varchar) / varchar | audit | ORD:850-855, LIB:968-993 |
| `codice_scuola`, `tipo_scuola`, `classe`, `corso`, `nominativo_scuola`, `indirizzo_scuola`, `cap_scuola`, `citta_scuola`, `provincia_scuola` | varchar | **[DA VERIFICARE]** citate solo nelle impostazioni dell'Elenco (ORD:859-878), copiate dal form Clienti; se non esistono l'Elenco va in errore | ORD:859-878 |

Chiave logica: (`anno_scolastico`, `ordine_progressivo`), **senza** vincolo d'unicità visibile nel codice.

### 4.2 `Ordine_Dettaglio` (lettura/scrittura)

| Colonna | Tipo probabile | Significato |
|---|---|---|
| `key_key` | int IDENTITY, PK | id riga |
| `keykey_testata` | int, FK → `Ordine_Testata.key_key` | ordine di appartenenza |
| `anno_testata` | int | anno: della **scheda cliente** se importata, dell'ordine se locale |
| `codice_scuola_testata`, `classe_testata` | varchar | scuola/classe del cliente (solo righe importate) |
| `data_testata` | datetime | data ordine |
| `progressivo_testata` | int | numero ordine |
| `barcode` | varchar | barcode dell'ordine (copiato) |
| `materia_disiplina` (sic) | varchar | materia |
| `codice_volume` | varchar | ISBN/codice libro |
| `autori`, `titolo`, `volume`, `editore` | varchar | anagrafica libro (denormalizzata) |
| `prezzo` | decimal/float | prezzo (3 decimali a video) |
| `nuova_adozione`, `da_acquistare`, `cons` | char(2) 'SI'/'NO' | flag dell'adozione (significato di `cons` da chiarire: «consigliato»? **[SUPPOSIZIONE]**) |
| `confermato`, `ordinato`, `arrivato` | char(2) 'SI'/'NO' | stato |
| `confermato_data`, `ordinato_data`, `arrivato_data` | datetime null | date di stato |
| `ordinato_numero` | int null | n. ordine (= `ordine_progressivo`) |
| `arrivato_numero` | int null | n. bolla di arrivo (scritto da Bolle) |
| `key_key_cliente_dettaglio` | int null, FK → `Cliente_Dettaglio.key_key` | prenotazione cliente di origine (solo importate) |
| `tipo` | varchar | `'importato'` / `'locale'` |
| `consegnato`, `consegnato_data` | char(2) / datetime | consegna al cliente (scritto da Clienti) |
| audit `inserimento_*`, `modifica_*` | | |

Fonti: ORD:1386-1445, 1134-1197, 2168-2189.

### 4.3 `Cliente_Dettaglio` (lettura + UPDATE)

Colonne lette/scritte qui: `key_key`, `keykey_testata` (→ `Cliente_Testata.key_key`), `anno_testata`, `codice_scuola_testata`, `classe_testata`, `materia_disiplina`, `codice_volume`, `autori`, `titolo`, `volume`, `editore`, `prezzo`, `nuova_adozione`, `da_acquistare`, `cons`, `confermato`, `ordinato`, `arrivato`, `confermato_data`, `ordinato_data` (datetime), `arrivato_data`, `ordinato_numero` (int), `arrivato_numero` (ORD:2168-2199, 1099-1103). Struttura identica a `Ordine_Dettaglio` per le colonne comuni.

### 4.4 `Cliente_Testata` (solo lettura)

`key_key`, `codice_scuola`, `nominativo_scuola`, `classe`, `cliente_codice_fiscale`, `cliente_cognome`, `cliente_nome` (ORD:1512-1527).

### 4.5 `Schede_Dettaglio` (solo lettura)

Ricerca per `codice_volume`, ordinata per `data_testata desc`; colonne lette: `materia_disiplina`, `autori`, `titolo`, `volume`, `editore`, `prezzo`, `nuova_adozione`, `da_acquistare`, `cons` (ORD:2211-2235).

### 4.6 Viste

- `Codici_Da_Ordinare_View`: colonne usate `codice_volume` (chiave usata dal form), `titolo`, `quantita`, `prezzo` (ORD:1809-1827, 2297-2298). Definizione **non presente nel codice** → da estrarre dal DB.
- `Codici_Ordinati_View`: usata solo dai report; colonne citate `keykey_testata`, `arrivato` (ORD:552-558). Definizione da estrarre dal DB.

### 4.7 Relazioni

```
Ordine_Testata 1 ──< Ordine_Dettaglio (keykey_testata)
Cliente_Testata 1 ──< Cliente_Dettaglio (keykey_testata)
Cliente_Dettaglio 1 ──0..1 Ordine_Dettaglio (Ordine_Dettaglio.key_key_cliente_dettaglio)
Cliente_Dettaglio.ordinato_numero  ≈ Ordine_Testata.ordine_progressivo (senza anno!)
Ordine_Dettaglio 1 ──0..1 Bolla_Dettaglio (Bolla_Dettaglio.key_key_ordine_dettaglio)   [sezione Bolle]
Ordine_Dettaglio.arrivato_numero ≈ numero bolla                                          [sezione Bolle]
```

Nessuna FK dichiarata è visibile dal codice: i legami sono solo applicativi **[DA VERIFICARE sullo schema]**.

---

## 5. Stampe ed export

### 5.1 Report Crystal (dialogo «Stampa Ordini», STP:79-274)

Pulsanti: «Ordinati» (scelta 1), «Arrivati» (scelta 2), «Da Ordinare» (scelta 3), «ANNULLA» (scelta 0) (STP:36-67, 176-268). Logica in ORD:538-567:

| Scelta | File .rpt | Selection formula Crystal |
|---|---|---|
| 1 Ordinati | `Mike_Ordini_Ordinati_Ordinati.rpt` | `{Codici_Ordinati_View.keykey_testata} = <key_key ordine corrente>` |
| 2 Arrivati | `Mike_Ordini_Ordinati_Arrivati.rpt` | stessa + `and {Codici_Ordinati_View.arrivato} = 'SI'` |
| 3 Da Ordinare | `Mike_Ordini_DaOrdinare.rpt` | nessuna (tutta la sorgente del report) |

- I `.rpt` vengono caricati dalla cartella dell'eseguibile (`Path.GetDirectoryName(Application.ExecutablePath) + "\" + file`, LIB:2812-2814). Nel pacchetto ricevuto stanno in `mik/x/MIK/BAMBU/` e `mik/fc/` → installazione in `C:\BAMBU\` **[SUPPOSIZIONE]**.
- La connessione del report riusa server/database/utente dell'app (LIB:2832-2864); il report si apre nel viewer interno (LIB:2866-2876), non viene stampato direttamente (`GS_Report_Direct_Print = "ko"` di default, LIB:180).
- Il contenuto/layout dei tre `.rpt` **non è stato estratto**: i file (47-48 KB, giugno 2023) sono in formato Crystal compresso/cifrato e le stringhe non sono leggibili con strumenti semplici. Servono Crystal Reports o un dump dal DB delle viste per conoscere colonne, raggruppamenti e totali.

### 5.2 Export CSV (ORD:2290-2308)

- Percorso: `C:\BAMBU\ordini_csv\<Numero>_ordini.csv`, dove `<Numero>` è il testo del campo Numero (`ordine_progressivo`), **senza anno**. `FileMode.Create` → sovrascrive.
- Contenuto: le righe **della griglia «da ordinare»** (dataset [0,11] = `Codici_Da_Ordinare_View`), **non** le righe dell'ordine.
- Formato esatto: una riga per codice, `codice_volume;quantita` + `\n` (solo LF), nessuna intestazione, nessun quoting, encoding UTF-8 senza BOM (default di `StreamWriter`). `quantita` è scritta con `ToString()` del valore del DB nella cultura del PC (se fosse decimale uscirebbe con la virgola, **[DA VERIFICARE il tipo]**).
- Messaggio finale: «Ordine N° <n> Esportato nella cartella C:\BAMBU\ordini_csv\».
- La cartella deve esistere: nessuna gestione dell'errore (eccezione non gestita).
- Il pulsante è visibile solo se la vista ha righe: dopo «Aggiungi Tutti» la vista si svuota e l'export sparisce. L'uso corretto è quindi **esportare prima di importare** **[SUPPOSIZIONE sul flusso del negoziante]**. Il CSV contiene **tutti** i codici pendenti, di tutti gli editori.

Esempio (illustrativo):

```
9788808123456;12
9788869101234;3
```

---

## 6. Collegamenti con le altre sezioni

| Sezione | Collegamento |
|---|---|
| **Clienti** (prenotazioni) | Fonte delle righe: `Cliente_Dettaglio` con `confermato='SI', ordinato='NO', arrivato='NO'`. L'import scrive su `Cliente_Dettaglio` `ordinato='SI'`, `ordinato_data`, `ordinato_numero`; l'eliminazione della riga importata li azzera. La scheda cliente blocca modifica/eliminazione delle righe ordinate/arrivate (CLI:1094-1138). La consegna al cliente scrive `Ordine_Dettaglio.consegnato` (CLI:2346-2349). L'etichetta info mostra cliente, scuola e classe della riga (ORD:1509-1530) |
| **Scuole / adozioni** | `Schede_Dettaglio` fornisce l'anagrafica del libro per le righe manuali (ORD:2206-2239). Le colonne `codice_scuola_testata`/`classe_testata` arrivano dalla scheda cliente |
| **Bolle** (arrivo merce) | Cerca le righe d'ordine aperte per codice, le collega con `Bolla_Dettaglio.key_key_ordine_dettaglio` e imposta `arrivato='SI'`, `arrivato_data`, `arrivato_numero` su `Ordine_Dettaglio` e `Cliente_Dettaglio`; carica il Magazzino (BOL:1088-1123, 1140-1228, 2335-2358, 1975-2030) |
| **Magazzino** | Nessun effetto diretto da Ordini. Gli effetti su `Magazzino` (`qta_prenotata_carico`, `qta_locale_carico`, `qta_prenotata_scarico`) li fanno Bolle e Clienti |
| **Menu** | Apertura da «Scheda Ordini» (MENU:407-430). Il form gestisce anche un passaggio di parametri dal parent per chiamate «fornitori/nuovo» e «articoli/nuovo» (ORD:619-660), ma il valore ricevuto non viene mai usato |

---

## 7. Stranezze, codice morto, bug, valori cablati (da NON copiare o da chiarire)

**Bug e incoerenze**

1. **Campo «Arrivato» legato alla colonna sbagliata**: `GS_LIB_TextBox_arrivato_dett.GS_LIB_Colonna = "cons"` (ORD:3864). A video il flag «arrivato» mostra in realtà `cons`.
2. **Anno = anno solare**, non anno scolastico (ORD:379). Un ordine di settembre 2026 e uno di marzo 2027 per lo stesso anno scolastico finiscono in due numerazioni diverse; se l'utente cambia l'anno a mano dopo il Nuovo il progressivo **non** viene ricalcolato.
3. **Numerazione con `max()+1` senza lock né vincolo unico** (ORD:380-383): con due postazioni si possono avere numeri doppi. La rilettura dopo l'insert usa `MAX(key_key)` (LIB:1065-1067), che con utenti concorrenti può puntare al record di un altro.
4. **`ordinato_numero` senza anno** (ORD:2196): su `Cliente_Dettaglio` resta solo il progressivo, ambiguo tra anni diversi.
5. **Importa senza transazione e con errori silenziati**: INSERT e UPDATE sono due comandi separati (ORD:2193, 2199) e `GS_LIB_Dbase_Calcola_Sql` restituisce 0 su qualunque eccezione (LIB:2612-2633). Se fallisce l'UPDATE la stessa prenotazione può essere importata due volte; se fallisce l'INSERT la prenotazione risulta «ordinata» senza riga d'ordine.
6. **SQL concatenato** con valori dell'utente (codice volume, ORD:2191, 2211, 1338): SQL injection e rottura con apici nei codici.
7. **Timestamp malformato**: i millisecondi non vengono riempiti di zeri (`.5` = 500 ms invece di 5 ms) (ORD:2166-2167). Inoltre la data usata è quella della **testata** (con l'ora di creazione dell'ordine), non quella dell'importazione.
8. **La vista «da ordinare» non filtra per fornitore/editore/anno** (ORD:1812): «Aggiungi Tutti» mette in un solo ordine, intestato a un solo fornitore, tutti i libri pendenti di tutti gli editori.
9. **Il CSV esporta la lista pendente, non l'ordine** (ORD:2295-2299); il nome file non contiene l'anno, quindi l'ordine 5 del 2027 sovrascrive l'ordine 5 del 2026; la cartella cablata `C:\BAMBU\ordini_csv\` deve esistere.
10. **Eliminazione di una riga già arrivata permessa** (ORD:1004-1022: blocca solo `consegnato`): su `Cliente_Dettaglio` torna `ordinato='NO'` ma `arrivato` resta 'SI' → stato incoerente; l'eventuale `Bolla_Dettaglio.key_key_ordine_dettaglio` resta orfano.
11. **Modifica riga sempre bloccata**: tutte le righe nascono con `ordinato='SI'`, quindi il pulsante «Registra» del dettaglio non può mai salvare (ORD:1037-1041); il codice `Dettaglio_Registra_001` (ORD:1134-1160) è irraggiungibile.
12. **Riga locale con `arrivato_data` valorizzata** pur avendo `arrivato='NO'` (ORD:1189): prende il valore del picker (sola lettura, svuotato con `IsNullDate`), quindi una data probabilmente casuale **[DA VERIFICARE nei dati]**.
13. **Controllo «Anno obbligatorio» inefficace** sul primo record (richiede `Record_Trovati > 0`, ORD:792).
14. **Messaggi di validazione sbagliati**: «Inserire Codice Cognome», «Inserire Codice Nome» per Ragione sociale e Nominativo (ORD:767, 773).
15. **Barcode**: se il progressivo supera le 9 cifre `Substring` va in eccezione (ORD:750). Non è un EAN valido (manca la cifra di controllo) e viene ricalcolato a ogni salvataggio.
16. **Stampa con «ANNULLA»**: con `scelta = 0` il nome del report resta quello precedente (all'avvio `""` → «file inesistente», LIB:2809-2812); dopo una stampa si riapre l'ultimo report scelto. Inoltre `GS_LIB_Dbase_Where_Report[0,0]` viene sovrascritto in modo permanente (ORD:552-563).
17. **Query su `Bolle`** (non di questa sezione ma riguarda gli ordini): `... and arrivato = 'NO' or tipo = 'locale'` senza parentesi (BOL:2353) → per precedenza SQL restituisce anche **tutte** le righe locali di qualunque codice. Da segnalare a chi migra le Bolle.
18. **Elenco testate con colonne della scheda cliente** (`tipo_scuola`, `classe`, `corso`, `nominativo_scuola`, …; `tipo_scuola` riceve due intestazioni diverse) (ORD:859-878): copia-incolla. Se le colonne non esistono in `Ordine_Testata` l'Elenco va in errore.

**Codice morto / residui di copia-incolla**

- `tabPage_1` con i campi Iban, Agenzia, Banca, Codice Fiscale, P.Iva, EMail 1-3, Cellulare, Telefono, Indirizzo, Città, CAP, Provincia, Tipologia, Data Accettazione, Numero (`textBoxExt4..40`, `doubleTextBox1/2`, `comboBoxAdv1`, `buttonAdv*`): dichiarati ma **mai aggiunti** a un contenitore e senza binding (ORD:4654-5690). Probabile residuo di un form Fornitori.
- `GS_LIB_ComboBoxAdv_articolo_taglia`, `gradientLabel1/2` «codice», `gradientPanelExt1`: non usati.
- `gS_LIB_TextBox5/6`, `gS_LIB_DoubleTextBox1` dentro la griglia «da ordinare», fuori area visibile e legati a `ordine_dettaglio` (ORD:3250-3368).
- `caller_flag`/`caller_mem` impostati in `Paint` e mai letti (ORD:619-660); `flag_ricerca_cod_colume` mai letto (ORD:31, 2236); `TableControl2_Click`, `gS_LIB_TextBox2_TextChanged`, `CButton_3_ClickButtonArea` (STP:48) vuoti; molti override che chiamano solo `base` o con istruzioni scartate (`_ = ...`, es. ORD:401-404, 753-758, 829-835).
- Etichetta del pannello «Dettaglio Scheda Cliente» (ORD:3691) e `GS_LIB_Tab_brush[1]` per una seconda scheda inesistente.
- «Duplica» della toolbar non fa nulla (LIB:1467-1470).

**Valori cablati**

- Utente di audit `"gigisoft"` / id 0 (ORD:670-671).
- Percorso `C:\BAMBU\ordini_csv\` (ORD:2293, 2302).
- Nomi dei report `Mike_Ordini_*.rpt` (ORD:551, 556, 562).
- Stati come stringhe `'SI'`/`'NO'` e `tipo` `'importato'`/`'locale'`.
- Formattazione prezzi `#,##.000` (3 decimali) a video (ORD:1415, 1824, 1827).

**Raccomandazioni per la migrazione (non copiare as is)**

- Modellare il fornitore come entità (tabella fornitori/distributori) invece di tre campi testo.
- Numerazione per anno scolastico con sequenza o vincolo unico (`anno`, `numero`), assegnata in transazione.
- Importazione in **una transazione** e collegamento 1:1 tramite FK (`ordine_riga.prenotazione_id`), con stati come enum/booleani + timestamp.
- Riga d'ordine con quantità (aggregata per codice) oppure mantenere «una riga per copia»: decidere col negoziante (vedi §8).
- CSV generato dalle righe dell'ordine, con anno nel nome del file e intestazione esplicita se il distributore la accetta.

---

## 8. Domande aperte per il negoziante

1. Il CSV `codice;quantità` a chi va mandato e in che formato lo vuole il distributore (separatore `;`, niente intestazione, fine riga LF)? Deve contenere tutti i libri da ordinare o solo quelli dell'ordine/fornitore corrente? Lo esporta **prima** di premere «Aggiungi Tutti»?
2. Fa un ordine per fornitore/editore o un ordine unico al distributore con tutti i libri? Serve filtrare i «da ordinare» per editore?
3. Cosa scrive in «Cod.», «Ragione Soc.» e «Nominativo»? Ha un elenco fisso di fornitori da gestire come anagrafica?
4. Il numero d'ordine deve ripartire per anno solare (come oggi) o per anno scolastico? Va bene che l'«Anno» sia l'anno solare?
5. A cosa gli servono le righe aggiunte a mano («locale»): scorte per il negozio, libri non prenotati? Servono quantità maggiori di 1 per riga?
6. Gli capita di dover correggere una riga d'ordine (prezzo, titolo)? Oggi è impossibile: come fa?
7. Cosa significano esattamente i flag «New» (`nuova_adozione`), «Acq.» (`da_acquistare`) e «Cons» (`cons`) e servono ancora nell'ordine?
8. Il «Totale» (somma dei prezzi di copertina) gli serve? Gli serve anche il totale con lo sconto del distributore o un prezzo d'acquisto?
9. Cosa contengono e a cosa servono i tre report «Ordinati», «Arrivati» e «Da Ordinare»? Può mandarne un esempio stampato o in PDF?
10. Quando un libro ordinato non arriva o viene annullato dal cliente, come procede (elimina la riga dall'ordine, la sposta su un altro ordine)?
11. Usa la funzione «Barcode» dell'ordine (stampa/scansione) da qualche parte?
12. Più persone usano il gestionale insieme (rischio di numeri d'ordine doppi)?
13. Va mantenuto lo storico degli ordini degli anni passati nella nuova piattaforma? Se sì, quanti anni?

**Da estrarre dal DB MIKE (non ricavabile dal codice)**: definizione di `Codici_Da_Ordinare_View` e `Codici_Ordinati_View`; tipi reali delle colonne e indici/vincoli di `Ordine_Testata`/`Ordine_Dettaglio`; esistenza delle colonne «scuola» in `Ordine_Testata`; layout dei tre `Mike_Ordini_*.rpt`.
