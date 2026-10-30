# Inventario funzionale — sezione CLIENTI (schede prenotazione libri)

Sorgenti analizzati (decompilati ILSpy, percorsi relativi a `scratchpad/src/`):

- `GS_MAG_SCHEDE_CLIENTE/GS_MAG/GS_MAG_SCHEDE_CLIENTE.cs` (abbreviato **CLI**)
- `GS_MAG_SCHEDE_CLIENTE/GS_MAG/GS_MAG_SCHEDE_CLIENTE_STAMPE.cs` (abbreviato **STA**)
- `GS_LIB/GS_LIB/GS_LIB_FORM_01.cs` (abbreviato **LIB**), `GS_LIB/GS_LIB/GS_LIB_Grid_00.cs` (abbreviato **GRID**)
- Per i collegamenti: `GS_MAG_SCHEDE_ORDINE/GS_MAG/GS_MAG_SCHEDE_ORDINE.cs` (**ORD**), `GS_MAG_SCHEDE_BOLLA/GS_MAG/GS_MAG_SCHEDE_BOLLA.cs` (**BOL**), `GS_MAG/GS_MAG/GS_MAG_MENU.cs` (**MENU**)

Convenzioni: «[dedotto]» indica una conclusione ricavata dal codice ma non scritta esplicitamente; «[ipotesi]» indica una supposizione da verificare sul DB reale o con il negoziante.

---

## 1. Scopo della sezione

La sezione «CLIENTI» (pulsante `CLIENTI` nel menu, MENU:785, apre il form con titolo «SCHEDE CLIENTI», CLI:699) gestisce le **schede di prenotazione dei libri scolastici** dei singoli clienti (in pratica: lo studente di una certa scuola/classe/anno). Ogni scheda (testata `Cliente_Testata`) contiene i dati del cliente e della classe e una lista di libri (dettaglio `Cliente_Dettaglio`), tipicamente importati dalla lista adozioni della classe (sezione Scuole, tabelle `Schede_*`). Ogni riga-libro percorre un ciclo di stato **non confermato → confermato → ordinato → arrivato → consegnato**; le fasi «ordinato» e «arrivato» sono impostate dalle sezioni Ordini e Bolle, «consegnato» da questa sezione, con effetti sui contatori di `Magazzino`.

---

## 2. Schermata

### 2.1 Struttura generale

- Form MDI, unica scheda visibile `tabPage_0` (CLI:707-716). Esiste una seconda scheda `tabPage_1` con campi di un'anagrafica fornitore non collegati al DB (codice morto, vedi §7).
- Barra strumenti ereditata da GS_LIB (tooltips LIB:5675-6017): Primo, Precedente, Successivo, Ultimo, Nuovo, Registra, Cerca, Applica, Annulla, Elimina, Refresh, Stampa, Duplica, Elenco, Esci, più scheda precedente/successiva.
- All'apertura il dataset della testata è caricato con `where Cliente_Testata.key_key < 0` (CLI:726): **la maschera si apre vuota**; per vedere schede bisogna usare Cerca → Applica (o Nuovo).
- Ordinamento dei risultati: `ORDER BY Cliente_Testata.data asc, Cliente_Testata.cliente_progressivo desc` (CLI:727).
- Il collegamento campo↔colonna è fatto da GS_LIB tramite le proprietà `GS_LIB_Colonna` e `GS_LIB_Indice` di ogni controllo (`"0000"` = testata, dataset [0,0]; `"0010"` = dettaglio, dataset [0,10]) (LIB:2002-2200).

### 2.2 Testata (scheda cliente) — tabella `Cliente_Testata`

Posizioni ricavate dalle coordinate del designer; coppie etichetta/controllo dedotte dalla vicinanza [dedotto].

| Etichetta | Controllo | Colonna DB | Tipo/controllo | Note |
|---|---|---|---|---|
| Numero | `gS_LIB_DoubleTextBox_cliente_progressivo` | `cliente_progressivo` | numerico intero, **sola lettura** (CLI:3750,3773) | calcolato a Nuovo (max+1 per anno, §3.1); diventa editabile solo in Cerca (CLI:467, 504, 523) |
| Barcode | `gS_LIB_TextBox_barcode` | `cliente_progressivo_barcode` | testo, sola lettura (CLI:3616, 3636) | ricalcolato a ogni salvataggio = anno + progressivo a 9 cifre (CLI:777-780) |
| C.Fiscale | `gS_LIB_TextBox_cliente_codice_fiscale` | `cliente_codice_fiscale` | testo (CLI:3660) | usato nel controllo duplicati |
| Cognome | `gS_LIB_TextBox_cliente_cognome` | `cliente_cognome` | testo (CLI:3791) | |
| Nome | `gS_LIB_TextBox_cliente_nome` | `cliente_nome` | testo (CLI:3703) | evento TextChanged vuoto (CLI:2101) |
| Telefono | `gS_LIB_TextBox1` | `cliente_telefono` | testo (CLI:3531) | |
| Data | `GS_LIB_DateTimePickerAdv_data` | `data` | data/ora, **sola lettura** (CLI:5358, 5370) | impostata a «adesso» a Nuovo (CLI:423) |
| Anno | `GS_LIB_DoubleTextBox_anno` | `anno_scolastico` | numerico intero, editabile (CLI:5277) | default = anno solare di oggi (CLI:424); ricerca per uguaglianza (CLI:5289) |
| Codice Scuola | `GS_LIB_TextBox_codice_scuola` | `codice_scuola` | testo (CLI:5188) | obbligatorio; all'uscita dal campo compila i dati scuola (§3.6) |
| Classe | `GS_LIB_TextBox_classe` | `classe` | testo (CLI:5145) | obbligatorio |
| Corso | `GS_LIB_TextBox_corso` | `corso` | testo (CLI:5232) | è la sezione (es. «A») [ipotesi]; usato dall'Importa |
| Tipo Scuola | `GS_LIB_TextBox_tipo_scuola` | `tipo_scuola` | testo, sola lettura (CLI:5101, 5121) | copiato da `Schede_Testata` |
| Scuola | `GS_LIB_TextBox_nominativo_scuola` | `nominativo_scuola` | testo, sola lettura (CLI:5057, 5077) | idem |
| Indirizzo | `GS_LIB_TextBox_indirizzo_scuola` | `indirizzo_scuola` | testo, sola lettura (CLI:5013, 5033) | idem |
| CAP | `GS_LIB_TextBox_cap_scuola` | `cap_scuola` | testo, sola lettura (CLI:4969, 4989) | idem |
| Città | `GS_LIB_TextBox_citta_scuola` | `citta_scuola` | testo, sola lettura (CLI:4925, 4945) | idem |
| Provincia | `GS_LIB_TextBox_provincia_scuola` | `provincia_scuola` | testo, sola lettura (CLI:4881, 4901) | idem |
| Acconto | `gS_LIB_DoubleTextBox1` | `acconto` | decimale, editabile (CLI:3237) | |
| Totale (1° box) | `gS_LIB_DoubleTextBox_totale_totale` | `totale` | decimale, sola lettura (CLI:3567, 3588) | = somma prezzi di **tutte** le righe (CLI:1921, 1924) |
| Totale (2° box) | `gS_LIB_DoubleTextBox_totale` | — (non legato) | decimale, sola lettura (CLI:3847, 3868) | = somma prezzi righe **confermate** (CLI:1917-1919, 1923) |
| Da Pagare | `gS_LIB_DoubleTextBox_dapagare` | — (non legato) | decimale, sola lettura (CLI:3184, 3206) | = totale confermati − acconto (CLI:1925-1926) |
| (nascosto/tecnico) | `gS_LIB_DoubleTextBox_key_key` | `key_key` | numerico (CLI:5402) | chiave; usato dall'Importa |

Le due caselle dopo l'etichetta «Totale» sono a x=977 e x=1109, l'etichetta a x=884 (posizioni designer) [dedotto: «Totale» generale e «Totale» confermato affiancati, senza etichetta distinta].

### 2.3 Dettaglio (libri della scheda) — griglia `GS_LIB_GRID_001`, tabella `Cliente_Dettaglio`

La griglia (con barra «Dettaglio Scheda Cliente», CLI:4038) è **visibile solo se c'è una scheda corrente salvata** e non si è in immissione/ricerca (CLI:742-757). La griglia è in sola lettura (`AllowEdit = false`, CLI:1462); si edita tramite i campi posti sopra la griglia.

Query della griglia: `SELECT ROW_NUMBER() OVER(ORDER BY codice_volume) AS Nr, Cliente_Dettaglio.* FROM Cliente_Dettaglio WHERE keykey_testata = <key_key testata> ORDER BY codice_volume asc` (CLI:1536-1543).

Colonne visibili (CLI:1478-1499):

| Intestazione | Colonna | Larghezza | Note |
|---|---|---|---|
| Nr | `Nr` (calcolata) | 30 | cella colorata secondo lo stato (§2.5) |
| Materia | `materia_disiplina` | 140 | (sic, «disiplina») |
| Cod.Volume | `codice_volume` | 130 | ISBN/codice libro [ipotesi] |
| Autori | `autori` | 200 | |
| Titolo | `titolo` | 300 | |
| Vol. | `volume` | 40 | |
| Editore | `editore` | 130 | |
| Prezzo | `prezzo` | 78 | formato `#,##.000` (3 decimali, CLI:1493) |
| New | `nuova_adozione` | 43 | SI/NO |
| Acq. | `da_acquistare` | 43 | SI/NO |
| Cons | `cons` | 43 | SI/NO (significato da chiarire, §8) |

Colonne nascoste (larghezza 0): audit, `key_key`, `keykey_testata`, `anno_testata`, `codice_scuola_testata`, `classe_testata`, `data_testata`, `progressivo_testata`, `barcode`, `confermato`, `ordinato`, `arrivato`, `confermato_data`, `ordinato_data`, `arrivato_data`, `ordinato_numero`, `arrivato_numero`, `consegnato`, `consegnato_data` (CLI:1464-1519).

Campi di editing del dettaglio (dentro il controllo griglia, senza etichette: si allineano alle colonne):

| Controllo | Colonna | Note |
|---|---|---|
| `GS_LIB_TextBox_codice_dett` | `codice_volume` | uscita dal campo → precompila da `Schede_Dettaglio` (§3.7) |
| `GS_LIB_TextBox_materia_dett` | `materia_disiplina` | freccia giù = campo ingrandito 300×100, freccia su = ripristina (CLI:1941-1958) |
| `GS_LIB_TextBox_autore_dett` | `autori` | idem (CLI:1972-1989) |
| `GS_LIB_TextBox_titolo_dett` | `titolo` | idem (CLI:2003-2020) |
| `GS_LIB_TextBox_volume_dett` | `volume` | |
| `GS_LIB_TextBox_editore_dett` | `editore` | idem ingrandimento (CLI:2034-2051) |
| `GS_LIB_DoubleTextBox_prezzo_dett` | `prezzo` | |
| `GS_LIB_TextBox_na_dett` | `nuova_adozione` | sola lettura, **clic = alterna NO/SI** (CLI:2053-2067) |
| `GS_LIB_TextBox_acq_dett` | `da_acquistare` | idem (CLI:2069-2083) |
| `GS_LIB_TextBox_cons_dett` | `cons` | idem (CLI:2085-2099) |
| `GS_LIB_TextBox_confermato_dett` | `confermato` | 21×18 px, sola lettura (CLI:4282, 4303) |
| `GS_LIB_TextBox_ordinato_dett` | `ordinato` | idem (CLI:4247, 4268) |
| `GS_LIB_TextBox_arrivato_dett` | **`cons`** (!) | legato alla colonna sbagliata — bug, §7 (CLI:4212) |
| `gS_LIB_DateTimePickerAdv_confermato_data` / `_ordinato_data` / `_arrivato_data` | `confermato_data` / `ordinato_data` / `arrivato_data` | sola lettura (CLI:4075-4197) |
| `GS_LIB_DoubleTextBox_scheda_nr` / `_scheda_key_key` / `_scheda_key_key_testata` | `Nr` / `key_key` / `keykey_testata` | tecnici |

Pulsanti interni alla griglia (da GS_LIB_Grid_00): **Aggiungi**, **Elimina**, **Registra** (GRID:400, 432, 464). Abilitazione: senza riga «agganciata» è attivo solo Aggiungi; dopo doppio clic su una riga i campi si legano alla riga e si attivano Elimina e Registra (LIB:4666-4688; CLI:1554-1564).

Pulsanti specifici di questa sezione (nel pannello della griglia):

| Pulsante | Visibilità | Azione |
|---|---|---|
| **Importa** (`CButton_importa`, CLI:3982) | sempre (con la griglia) | importa i libri della classe dalla lista adozioni (§3.5) |
| **Conferma / Annulla** (`cButton_conferma`, CLI:4340) | riga NO/NO/NO o SI/NO/NO (CLI:1626-1680) | alterna `confermato` (§3.8) |
| **Consegna / Rimuovi Consegna** (`cButton_consegnato`, CLI:4020) | riga confermata+ordinata+arrivata (CLI:1613-1624, 1689-1695) | alterna `consegnato`, aggiorna Ordini/Bolle/Magazzino (§3.9) |
| **Consegna da Magazzino N / Rientro in Magazzino** (`cButton_disponibile_magazzino`, CLI:3943) | riga NO/NO/NO con `Magazzino.qta_locale > 0`, oppure riga NO/NO/NO già consegnata (CLI:1641-1672) | consegna dal disponibile di negozio o lo rimette (§3.10) |
| quadratino di stato (`cButton_state`) | dopo doppio clic su una riga | colore = stato della riga |
| «LEGENDA» (etichetta, CLI:3072) | al passaggio del mouse mostra `panel_legend` (CLI:2368-2377) | voci: Non Confermato, Confermato, Ordinato, Arrivato, Consegnato (CLI:3293-3374) |

Etichetta informativa `gradientLabel_info` sotto la testata: alla selezione di una riga mostra «N° Ordine <n> <gg/mm/aaaa>» e «N° Bolla <n> <gg/mm/aaaa>» presi da `Ordine_Dettaglio` e `Bolla_Dettaglio` con `key_key_cliente_dettaglio` = riga (CLI:1598-1612). Viene mostrato solo il primo valore trovato (scalar, LIB:2635-2656).

### 2.4 Elenco (vista tabellare) e ricerca

- **Elenco** (toolbar): griglia sola lettura con tutte le colonne di `Cliente_Testata` (LIB:1480-1501). Personalizzazioni (CLI:920-969): nascoste audit, `key_key`, `codice_scuola`; titoli: Data, Tipo Scuola, Classe, Corso, Anno, Nominativo, Indirizzo, CAP, Città, Provincia, Totale (valuta, separatore migliaia «.» decimali «,»). Le colonne cliente (cognome, nome, CF, telefono, progressivo, barcode, acconto) **non sono configurate** e appaiono con il nome grezzo e larghezza di default [dedotto].
- **Cerca → Applica** (LIB:1113-1155, 3700-4348): svuota la maschera; si compilano uno o più campi della testata; la WHERE è costruita in AND su tutti i campi legati alla testata con ricerca abilitata:
  - campi testo (tipo ricerca `>=`) → `colonna LIKE 'valore%'` (LIB:3961-3965);
  - numerici con `>=` → `colonna >= valore` (es. Numero, Acconto, Totale) [dedotto dal ramo DoubleTextBox, LIB:3990-4012];
  - Anno con `=` → uguaglianza (CLI:5289);
  - Data (se non vuota) → confronto `>=` [dedotto, LIB:4124-4200].
  - Esc durante la ricerca interrompe il thread di caricamento (LIB:4585-4600).

### 2.5 Stati della riga e colori (cella «Nr» e quadratino)

Valori SI/NO di `confermato`/`ordinato`/`arrivato` + `consegnato` (CLI:1756-1795, 1872-1887, 1613-1696):

| Stato | confermato | ordinato | arrivato | consegnato | Colore |
|---|---|---|---|---|---|
| Non confermato | NO | NO | NO | NO | azzurro polvere → blu ardesia |
| Confermato | SI | NO | NO | — | giallo → arancio |
| Ordinato | SI | SI | NO | — | rosso → arancio-rosso |
| Arrivato | SI | SI | SI | NO | verde lime |
| Consegnato | qualsiasi | | | SI | blu Dodger → ciano (prevale) |

Caso particolare: NO/NO/NO con `consegnato = SI` = consegnato da magazzino locale (quadratino verde, CLI:1662-1672; cella Nr blu-ciano).

---

## 3. Flussi

### 3.1 Nuova scheda (toolbar «Nuovo» → «Registra»)

1. GS_LIB aggiunge una riga vuota (LIB:916-930).
2. `GS_LIB_Button_Nuovo_Dopo` (CLI:419-432): `data` = adesso; `anno_scolastico` = **anno solare** della data; `cliente_progressivo` = `select max(cliente_progressivo) from Cliente_Testata where anno_scolastico = <anno>` + 1; focus sul codice fiscale.
3. L'operatore compila CF, cognome, nome, telefono, codice scuola (all'uscita: §3.6), classe, corso, acconto.
4. «Registra» → controlli (CLI:766-882):
   - sempre: `cliente_progressivo_barcode` = `anno` + progressivo con zeri a sinistra fino a 9 cifre (es. anno 2026, n. 12 → `2026000000012`) (CLI:777-780);
   - obbligatori: Codice Scuola, Classe, Anno (messaggi «Inserire Codice Scuola/Classe/Anno», CLI:805-822 e 862-879);
   - duplicato: `select count(*) from Cliente_Testata where anno_scolastico = A and codice_scuola = 'S' and classe = 'C' and cliente_codice_fiscale = 'CF'` > 0 → «scheda già inserita», blocca (CLI:790-797);
   - classe esistente: `select count(classe) from Schede_Testata where anno_scolastico = A and codice_scuola = 'S' and classe = 'C'` = 0 → «Classe inesistente / Registrare lo stesso ?» (Sì/No) (CLI:798-803).
   - **Attenzione**: i due controlli di duplicato/classe in immissione scattano solo se `GS_LIB_Dbase_Record_Trovati > 0` (CLI:784); se si fa Nuovo appena aperta la maschera (dataset vuoto), sono saltati [dedotto, LIB:2382-2389 + CLI:726]. Vedi §7.
5. Salvataggio generico GS_LIB (LIB:945-1095): imposta audit `inserimento_*` e `modifica_*` (utente cablato «gigisoft», id 0, CLI:705-706), `INSERT` via OleDbCommandBuilder; poi ricarica la scheda con `key_key = MAX(key_key)` (LIB:1060-1069) [dedotto: `key_key` è IDENTITY].

### 3.2 Modifica scheda

- Si cambiano i campi e si preme Registra. Valgono gli stessi obbligatori; il controllo duplicato esclude la scheda stessa (`and key_key <> <id>`) e il controllo «Classe inesistente» ripropone la domanda a ogni salvataggio (CLI:824-850).
- Concorrenza: se il record è stato cancellato o modificato da altri, GS_LIB avvisa e ricarica (LIB:1021-1059).
- Il barcode viene ricalcolato a ogni salvataggio (CLI:777-780): se si cambia l'anno o il progressivo cambia anche il barcode, ma **non** le copie di `barcode`/`progressivo_testata`/`anno_testata` già scritte nelle righe di dettaglio [dedotto].

### 3.3 Cancellazione scheda (toolbar «Elimina»)

- Bloccata se la scheda ha righe di dettaglio: «Esiste dettaglio / Impossibile Eliminare» (CLI:897-910).
- Altrimenti doppia conferma («CONFERMI ELIMINAZIONE ?», «SICURO ?») e DELETE (LIB:1318-1337). La cancellazione a cascata `delete Cliente_Dettaglio where keykey_testata = X` (CLI:1196-1203, chiamata da LIB:1270-1276) è di fatto inutile perché si arriva lì solo senza righe.

### 3.4 Aggiunta manuale di un libro (pulsante griglia «Aggiungi»)

1. L'operatore compila i campi del dettaglio (con il codice volume precompila il resto, §3.7).
2. Controlli (CLI:1150-1161, 1315-1400, 1402-1428): deve esserci una scheda corrente; obbligatori codice, materia, autore, titolo, volume, editore, prezzo ≠ 0 (messaggi «Inserire codice/materia/autore/titolo/volume/editore/prezzo»); New/Acq./Cons vuoti → «NO»; lo stesso `codice_volume` non può comparire due volte nella stessa scheda («Codice X già inserito», query `SELECT * from Cliente_Dettaglio where keykey_testata = T and codice_volume = 'X'`).
3. Inserimento (CLI:1234-1275): `confermato`/`ordinato`/`arrivato` = «NO», `consegnato` = «NO», `consegnato_data` = null; copia dalla testata `keykey_testata`, `anno_testata`, `codice_scuola_testata`, `classe_testata`, `data_testata` (= data scheda), `progressivo_testata`, `barcode`; date di stato prese dai date-picker (vedi §7).
4. Ricalcolo totali (§3.11). **Non** viene salvata la testata, quindi la colonna `totale` resta quella precedente finché non si salva la testata [dedotto: Registra(0,0) non è chiamato in CLI:1234-1275, a differenza di Importa/Conferma].

### 3.5 Importa libri dalla scheda scuola (pulsante «Importa», CLI:2105-2175)

1. Se il campo Corso è valorizzato, cerca la scheda della classe: `select key_key from Schede_Testata where anno_scolastico = A and codice_scuola = 'S' and classe = 'C' and corso = 'K'` (CLI:2138-2146).
2. Esegue un unico `INSERT ... SELECT` (CLI:2147-2171):
   ```sql
   insert into Cliente_Dettaglio (keykey_testata, anno_testata, codice_scuola_testata, classe_testata, data_testata,
     progressivo_testata, barcode, materia_disiplina, codice_volume, autori, titolo, volume, editore, prezzo,
     nuova_adozione, da_acquistare, cons, confermato, ordinato, arrivato, confermato_data, ordinato_data,
     arrivato_data, ordinato_numero, arrivato_numero, consegnato, consegnato_data)
   select <key_key scheda>, anno_testata, codice_scuola_testata, classe_testata, '<data scheda>', <progressivo>,
     '<barcode>', materia_disiplina, codice_volume, autori, titolo, volume, editore, prezzo, nuova_adozione,
     da_acquistare, cons, 'NO','NO','NO', null,null,null, 0,0, 'NO', null
   from Schede_Dettaglio
   where anno_testata = A and codice_scuola_testata = 'S' and classe_testata = 'C'
     [and keykey_testata = <key Schede_Testata>]      -- solo se Corso valorizzato
     and (codice_volume not in (select codice_volume from Cliente_Dettaglio
          where anno_testata = A and codice_scuola_testata = 'S' and classe_testata = 'C' and barcode = '<barcode>'))
   ```
   Quindi: vengono importati **tutti** i libri della lista adozioni (anche quelli con `da_acquistare = NO`), tutti come «non confermati», saltando i codici già presenti nella scheda.
3. Ricarica la griglia, ricalcola i totali e **salva la testata** (Registra(0,0)) per aggiornare `totale` (CLI:2172-2174).

### 3.6 Uscita dal campo «Codice Scuola» (CLI:2177-2206)

Se il codice scuola è pieno e il nominativo è vuoto: `SELECT codice_scuola, tipo_scuola, classe, corso, anno_scolastico, nominativo_scuola, indirizzo_scuola, cap_scuola, citta_scuola, provincia_scuola FROM Schede_Testata where codice_scuola = 'S' ORDER BY codice_scuola asc`; dalla **prima riga** copia corso, tipo, nominativo, indirizzo, CAP, città, provincia. Non filtra per anno né per classe (vedi §7).

### 3.7 Uscita dal campo «Cod.Volume» del dettaglio (CLI:2208-2241)

`SELECT Schede_Dettaglio.* FROM Schede_Dettaglio where codice_volume = 'X' ORDER BY data_testata desc`: dalla riga più recente copia materia, autori, titolo, volume, editore, prezzo, nuova_adozione, da_acquistare, cons. Nessuna ricerca su `Magazzino` o su un catalogo articoli.

### 3.8 Conferma / Annulla conferma di una riga (CLI:2243-2278)

- Se la riga è confermata: se arrivata → «Impossibile Annullare / E' arrivato»; se ordinata → «Impossibile Annullare / E' ordinato»; altrimenti `confermato = 'NO'`, `confermato_data = null`.
- Se non confermata: `confermato = 'SI'`, `confermato_data = adesso`.
- Salva la riga, ricarica, ricalcola i totali e **salva la testata** (`totale`).
- La conferma è il presupposto perché la riga venga presa dagli Ordini (ORD:2190-2199 filtra `confermato = 'SI' and ordinato = 'NO' and arrivato = 'NO'`) e perché compaia nella stampa (§5).

### 3.9 Consegna / Rimuovi consegna di un libro arrivato (CLI:2280-2366)

Agisce solo se `arrivato = 'SI'` (CLI:2287):

- **Consegna** (consegnato NO → SI): `consegnato = 'SI'`, `consegnato_data = adesso`; poi
  - `update Ordine_Dettaglio set consegnato = 'SI', consegnato_data = '<ora>' where key_key_cliente_dettaglio = '<id riga>'` (CLI:2346-2349);
  - `update Bolla_Dettaglio set consegnato = 'SI', consegnato_data = '<ora>' where key_key_cliente_dettaglio = '<id riga>'` (CLI:2351-2354);
  - `update Magazzino set qta_prenotata_scarico = qta_prenotata_scarico + 1 where codice_volume = 'X'` (CLI:2357-2360).
- **Rimuovi consegna** (SI → NO): `consegnato = 'NO'`, data null; stesse UPDATE su Ordine/Bolla con 'NO' e null (CLI:2295-2303); poi `update Magazzino set qta_prenotata_carico = qta_prenotata_carico + 1` (CLI:2306-2309) — **asimmetrico, probabile bug** (§7).
- Salva la riga e ricarica (CLI:2363-2365). La testata non viene risalvata.

### 3.10 Consegna da magazzino / Rientro in magazzino (CLI:2379-2435)

Per righe non confermate/ordinate/arrivate quando il negozio ha il libro disponibile:

- Disponibilità letta alla selezione della riga: `select qta_locale from Magazzino where codice_volume = 'X'` (CLI:1641-1659); se > 0 il pulsante mostra «Consegna da Magazzino <qta>».
- **Consegna**: `consegnato = 'SI'`, `consegnato_data = adesso`; `update Magazzino set qta_locale_scarico = qta_locale_scarico + 1 where codice_volume = 'X'` (CLI:2424-2430).
- **Rientro** (riga già consegnata): `consegnato = 'NO'`, data null; `qta_locale_scarico = qta_locale_scarico - 1` (CLI:2385-2391).
- La riga resta `confermato = 'NO'`: non entra nel «Totale» confermato, nel «Da Pagare» né nella stampa (§7).

### 3.11 Calcoli dei totali (CLI:1902-1927)

- `Totale confermato` = Σ `prezzo` delle righe con `confermato = 'SI'`.
- `totale` (colonna DB) = Σ `prezzo` di **tutte** le righe.
- `Da Pagare` = Totale confermato − `acconto`.
- Ogni riga vale **una copia**: non esistono quantità, sconti, IVA o arrotondamenti nel codice. Il prezzo è quello della lista adozioni (o digitato).
- Ricalcolati a ogni cambio scheda, dopo Aggiungi/Registra/Elimina riga, Importa, Conferma (CLI:752, 1190, 1230, 1273, 2173, 2275).

### 3.12 Modifica di una riga (doppio clic → campi → «Registra» della griglia)

- Bloccata se la riga è arrivata, ordinata o confermata («Impossibile registrare / E' …», CLI:1118-1140): si possono modificare **solo le righe non confermate**.
- Stessi obbligatori dell'aggiunta e controllo codice duplicato escludendo la riga stessa (CLI:1298-1313, 1417-1420).
- Riscrive tutti i campi, compresi `confermato`/`ordinato`/`arrivato` letti dalle caselline (CLI:1205-1232) → vedi bug `arrivato_dett` in §7.

### 3.13 Cancellazione di una riga (pulsante griglia «Elimina»)

- Bloccata se consegnata, arrivata, ordinata o confermata (CLI:1086-1108; per la confermata il messaggio dice erroneamente «Impossibile registrare»).
- Doppia conferma («CONFERMI ELIMINAZIONE ?», «SICURO ?», CLI:1277-1296), poi DELETE della riga (CLI:1187-1194). Nessun effetto su Magazzino/Ordini/Bolle (coerente: si cancellano solo righe mai confermate).

---

## 4. Tabelle DB toccate

Tipi «probabili» dedotti dall'uso (formati, confronti con apici, controlli usati). Nessuno schema DDL disponibile [ipotesi sui tipi].

### 4.1 `Cliente_Testata` (scheda cliente)

| Colonna | Tipo probabile | Significato / fonte |
|---|---|---|
| `key_key` | int IDENTITY, PK | chiave (CLI:728; LIB:1063) |
| `data` | datetime | data scheda |
| `anno_scolastico` | int | anno (solare alla creazione) |
| `cliente_progressivo` | int | numero scheda, max+1 per anno |
| `cliente_progressivo_barcode` | varchar(≥13) | anno + progressivo 9 cifre |
| `cliente_codice_fiscale` | varchar | CF cliente |
| `cliente_cognome`, `cliente_nome` | varchar | |
| `cliente_telefono` | varchar | |
| `codice_scuola` | varchar | → `Schede_Testata.codice_scuola` (relazione logica, senza FK [ipotesi]) |
| `tipo_scuola`, `nominativo_scuola`, `indirizzo_scuola`, `cap_scuola`, `citta_scuola`, `provincia_scuola` | varchar | copie denormalizzate da `Schede_Testata` |
| `classe` | varchar | |
| `corso` | varchar | sezione |
| `acconto` | decimal/money | acconto versato |
| `totale` | decimal/money | somma prezzi di tutte le righe |
| `inserimento_data`, `inserimento_utente_key_key`, `inserimento_utente_nome`, `modifica_data`, `modifica_utente_key_key`, `modifica_utente_nome` | datetime / varchar | audit GS_LIB (LIB:986-1010; colonne citate in CLI:933-938) |

Unicità applicativa (non vincolo DB [ipotesi]): (`anno_scolastico`, `codice_scuola`, `classe`, `cliente_codice_fiscale`).

### 4.2 `Cliente_Dettaglio` (libro prenotato, una copia per riga)

| Colonna | Tipo probabile | Significato |
|---|---|---|
| `key_key` | int IDENTITY, PK | id riga; referenziato da `Ordine_Dettaglio.key_key_cliente_dettaglio` e `Bolla_Dettaglio.key_key_cliente_dettaglio` |
| `keykey_testata` | int | FK logica → `Cliente_Testata.key_key` |
| `anno_testata`, `codice_scuola_testata`, `classe_testata`, `data_testata`, `progressivo_testata`, `barcode` | int / varchar / datetime | copie denormalizzate dalla testata |
| `materia_disiplina`, `codice_volume`, `autori`, `titolo`, `volume`, `editore` | varchar | dati libro (`codice_volume` = chiave articolo verso `Magazzino`) |
| `prezzo` | decimal (3 decimali mostrati) | prezzo copertina [ipotesi] |
| `nuova_adozione`, `da_acquistare`, `cons` | char(2) 'SI'/'NO' | flag della lista adozioni |
| `confermato`, `ordinato`, `arrivato`, `consegnato` | char(2) 'SI'/'NO' | stato |
| `confermato_data`, `ordinato_data`, `arrivato_data`, `consegnato_data` | datetime null | date di stato |
| `ordinato_numero`, `arrivato_numero` | int null | numero ordine / numero progressivo bolla (scritti da ORD:2196, BOL:2019) |
| audit (come testata) | | |

### 4.3 Altre tabelle lette/scritte

| Tabella | Uso in questa sezione | Colonne citate |
|---|---|---|
| `Schede_Testata` (lista adozioni per classe) | lettura: dati scuola, controllo classe esistente, key per Importa | `key_key`, `codice_scuola`, `tipo_scuola`, `classe`, `corso`, `anno_scolastico`, `nominativo_scuola`, `indirizzo_scuola`, `cap_scuola`, `citta_scuola`, `provincia_scuola` |
| `Schede_Dettaglio` (libri adottati) | lettura: Importa, precompilazione per codice volume | `keykey_testata`, `anno_testata`, `codice_scuola_testata`, `classe_testata`, `data_testata`, `materia_disiplina`, `codice_volume`, `autori`, `titolo`, `volume`, `editore`, `prezzo`, `nuova_adozione`, `da_acquistare`, `cons` |
| `Magazzino` | lettura `qta_locale`; UPDATE contatori | `codice_volume`, `qta_locale`, `qta_locale_scarico`, `qta_prenotata_carico`, `qta_prenotata_scarico` |
| `Ordine_Dettaglio` | lettura per info; UPDATE consegnato | `progressivo_testata`, `data_testata`, `key_key_cliente_dettaglio`, `consegnato`, `consegnato_data` |
| `Bolla_Dettaglio` | lettura per info; UPDATE consegnato | idem |

Contatori di `Magazzino` [dedotto dall'insieme Clienti+Bolle]: `qta_prenotata_carico` = copie arrivate per prenotazioni (+1 all'arrivo in bolla, BOL:2509); `qta_prenotata_scarico` = copie prenotate consegnate (+1 alla consegna, CLI:2357); `qta_locale_carico`/`qta_locale_scarico` = carichi/scarichi del disponibile di negozio. `qta_locale` e `qta_prenotata` non vengono mai scritti dal codice visto: [ipotesi] colonne calcolate o viste (es. `qta_locale = qta_locale_carico − qta_locale_scarico`) — da verificare sullo schema.

---

## 5. Stampe / export

- **Stampa** (toolbar) → finestra «Stampa Cliente» con i soli pulsanti «Stampa» e «ANNULLA» (STA:146, 175, 186).
  - «Stampa»: report Crystal **`Mike_Cliente.rpt`**, caricato dalla cartella dell'eseguibile (LIB:2815), formula di selezione `{Cliente_Testata.key_key} = <id scheda> and {Cliente_Dettaglio.confermato} = 'SI'` (CLI:594-599). Stampa quindi la scheda con **solo i libri confermati** [dedotto: contenuto del layout non disponibile, il .rpt non è tra i sorgenti].
  - Il report viene mostrato in anteprima nel viewer (stampa diretta solo se `GS_Report_Direct_Print == "ok"`, LIB:2877-2881).
  - La connessione del report usa server/DB/utente della sessione (credenziali dal form MDI, non riportate qui).
- Nessun export CSV/Excel in questa sezione. Nessun percorso file cablato oltre al nome del .rpt.

---

## 6. Collegamenti con le altre sezioni

- **Scuole (`GS_MAG_SCHEDE`, tabelle `Schede_Testata`/`Schede_Dettaglio`)**: fonte dei dati scuola (§3.6), dei libri da importare (§3.5), della precompilazione per codice (§3.7) e del controllo «Classe inesistente» (§3.1).
- **Ordini (`GS_MAG_SCHEDE_ORDINE`)**: l'ordine al fornitore per un codice volume copia in `Ordine_Dettaglio` tutte le righe cliente con `confermato='SI' and ordinato='NO' and arrivato='NO'` (con `key_key_cliente_dettaglio` e `tipo='importato'`) e imposta su `Cliente_Dettaglio` `ordinato='SI'`, `ordinato_data`, `ordinato_numero` (ORD:2168-2199). Cancellando la riga d'ordine importata riporta `ordinato='NO'` e azzera data/numero (ORD:1093-1104).
- **Bolle (`GS_MAG_SCHEDE_BOLLA`)**: all'arrivo imposta su `Cliente_Dettaglio` `arrivato='SI'`, `arrivato_data`, `arrivato_numero` (BOL:2017-2022) e incrementa `Magazzino.qta_prenotata_carico` (BOL:2500-2530); cancellando la riga di bolla importata riporta `arrivato='NO'` e decrementa `qta_prenotata_carico` (BOL:1088-1106).
- **Magazzino**: questa sezione legge `qta_locale` e scrive `qta_prenotata_scarico`, `qta_prenotata_carico` (rimozione consegna) e `qta_locale_scarico` (§3.9-3.10).
- **Consegna**: propaga `consegnato`/`consegnato_data` su `Ordine_Dettaglio` e `Bolla_Dettaglio` tramite `key_key_cliente_dettaglio` (§3.9).

---

## 7. Stranezze, codice morto, bug, valori cablati (da NON copiare o da chiarire)

**Bug evidenti**

1. **`GS_LIB_TextBox_arrivato_dett` legato alla colonna `cons`** invece di `arrivato` (CLI:4212). Modificando una riga (doppio clic + Registra della griglia) il codice scrive `arrivato = <valore di cons>` (CLI:1225): una riga con `cons = SI` diventerebbe «arrivata» senza bolla [dedotto]. Nella migrazione lo stato va gestito solo dai flussi, non da campi editabili.
2. **«Rimuovi Consegna» incrementa `qta_prenotata_carico`** (CLI:2306) invece di decrementare `qta_prenotata_scarico`: l'annullo di una consegna gonfia il magazzino prenotato. Da correggere (e i contatori storici potrebbero essere già sfasati).
3. **Controlli di duplicato e «Classe inesistente» saltati** se si fa Nuovo con dataset vuoto (es. appena aperta la maschera): la condizione richiede `Record_Trovati > 0` (CLI:784, 726; LIB:2382-2389) [dedotto].
4. **Codice fiscale vuoto = collisione**: due clienti senza CF nella stessa scuola/classe/anno risultano «scheda già inserita» (CLI:790-792) [dedotto].
5. **Lookup scuola sbagliato**: all'uscita dal Codice Scuola prende la prima riga di `Schede_Testata` per quel codice senza filtrare anno/classe (CLI:2181-2203): il **corso** copiato può essere di un'altra classe o di un altro anno, e Importa poi filtra per quel corso.
6. **Importa senza Corso** prende i libri di tutte le sezioni della classe; se due sezioni hanno lo stesso libro la SELECT produce righe doppie (il `NOT IN` guarda solo quelle già salvate) [dedotto, CLI:2159-2170].
7. **Consegna da magazzino non conferma la riga**: resta `confermato='NO'`, quindi il libro consegnato non entra in Totale/Da Pagare né nella stampa (CLI:2424-2430, 1917, 598). Da chiarire se il pagamento avviene altrove.
8. **Anno «scolastico» = anno solare** della data di creazione (CLI:424): una scheda creata a gennaio per l'a.s. in corso finisce sull'anno successivo rispetto a una di settembre. Anche la numerazione (max+1 per anno, CLI:425-428) si spezza così.
9. **Progressivo calcolato al Nuovo, non al salvataggio** (CLI:425-428): due postazioni possono ottenere lo stesso numero; cambiando l'anno dopo Nuovo il numero non si ricalcola.
10. **Chiave del nuovo record = `MAX(key_key)`** dopo l'INSERT (LIB:1063): con utenti concorrenti può riaprire la scheda di un altro.
11. **Totale DB non aggiornato** dopo Aggiungi/Modifica/Elimina riga (solo Importa e Conferma risalvano la testata, CLI:2174, 2276) [dedotto].
12. Le date di stato a Nuovo/Registra riga sono prese dai date-picker anche quando mostrano «vuoto» (`IsNullDate`), quindi potrebbero scrivere una data non nulla con stato «NO» (CLI:1226-1228, 1264-1266) [ipotesi: dipende dal comportamento Syncfusion di `Value` con `IsNullDate`].
13. Messaggio sbagliato nella cancellazione di riga confermata: «Impossibile registrare» (CLI:1106).
14. UPDATE su `Ordine_Dettaglio`/`Bolla_Dettaglio` confrontano `key_key_cliente_dettaglio` con una stringa tra apici (CLI:2297, 2302, 2348, 2353): funziona per conversione implicita, da non replicare.
15. Ogni conferma risalva la testata e ripropone «Classe inesistente / Registrare lo stesso ?» se la classe non esiste (CLI:2276 → CLI:844-849) [dedotto].
16. Formato data costruito a mano con millisecondi non zero-padded (es. `.5`) (CLI:2134-2135, 2340-2341).
17. Tutte le query sono concatenate (SQL injection, apostrofi in cognome/titoli rompono le query, es. CLI:2213, 2142-2144).

**Valori cablati**

- Utente audit «gigisoft», id 0 (CLI:705-706).
- Report `Mike_Cliente.rpt` (CLI:596); filtro `confermato = 'SI'` (CLI:598).
- Valori di stato stringa 'SI'/'NO' ovunque; barcode con padding a 9 cifre (CLI:777).
- Dimensioni e colori della maschera (form 1252×975, MENU:402-403).

**Codice morto / residui di copia-incolla**

- `tabPage_1` con campi da anagrafica fornitore (Iban, Agenzia, Banca, Codice Fiscale, P.Iva, EMail 1-3, Cellul., Telefono, Indirizzo, Tipologia, Data Accettazione…) tutti senza colonna (CLI:5433-6483).
- `GS_LIB_ComboBoxAdv_articolo_taglia` senza colonna (CLI:5459-5467); `gradientLabel1` «codice» non aggiunto a nessun contenitore (CLI:3082-3085).
- Gestione chiamante «fornitori»/«articoli» in `Paint` con `caller_flag`/`caller_mem` mai usati (CLI:656-695); `GS_LIB_FORM_01_Caller` vuoto (CLI:762-764).
- `flag_ricerca_cod_colume` impostato e mai letto (CLI:2210, 2238); `gS_LIB_TextBox2_TextChanged` vuoto (CLI:2101); handler griglia vuoti (CLI:1699-1709); `GS_LIB_Registra_Controlla_Corrente`/`Immissione_Automatica` senza effetto (CLI:884-918).
- Stampe: handler `CButton_2`/`CButton_3` senza pulsanti (STA:38-48).
- Elenco: stile per colonna `codice_volume` inesistente nella testata (CLI:983, 1000); intestazione «Codice Scuola» assegnata a `tipo_scuola` e subito sovrascritta (CLI:942-944).
- Cascata `delete Cliente_Dettaglio` alla cancellazione della testata, irraggiungibile (CLI:1196-1203 vs 903-907).
- Pulsante «Duplica» della toolbar senza implementazione (LIB:1467-1470).

---

## 8. Domande aperte per il negoziante

1. **Anno scolastico**: va inteso come anno di inizio (es. 2026 per 2026/27)? Le schede fatte tra gennaio e agosto a quale anno devono appartenere?
2. **Numerazione**: il numero scheda deve ripartire da 1 ogni anno scolastico? Il barcode (anno + numero a 9 cifre) è stampato su etichette/ricevute e letto con lo scanner? Va mantenuto identico?
3. **Codice fiscale**: è obbligatorio? Come si distinguono due fratelli o due clienti senza CF nella stessa classe? Nell'e-commerce il cliente sarà un account: una scheda per figlio?
4. **Corso/sezione**: le liste adozioni cambiano per sezione? Quando si importa, si devono prendere solo i libri `da_acquistare = SI` o tutti?
5. **Significato di `cons`** (colonna «Cons») e di «New»/«Acq.»: sono i flag ministeriali (consigliato, nuova adozione, da acquistare)? Servono al cliente online?
6. **Quantità**: ogni riga è sempre una copia? Capita di prenotare più copie dello stesso libro nella stessa scheda?
7. **Prezzi e sconti**: si applica uno sconto sui libri scolastici (es. percentuale, buoni/cedole)? Il prezzo da usare è quello della lista adozioni o quello del magazzino/editore?
8. **Acconto e saldo**: come si registrano pagamenti successivi all'acconto? «Da Pagare» considera solo i libri confermati: è corretto?
9. **Conferma**: cosa significa per il cliente «confermato» (ha detto sì a quel libro / ha pagato l'acconto)? Si conferma un libro alla volta o tutta la scheda?
10. **Consegna da magazzino**: un libro consegnato dal disponibile del negozio va pagato? Perché non risulta confermato né in stampa?
11. **Rimuovi consegna**: quando succede (reso, errore)? Il libro torna disponibile per altri clienti o resta riservato a quella scheda?
12. **Consegna parziale / usato**: esistono libri usati, cedole librarie comunali o regionali da gestire?
13. **Stampa `Mike_Cliente.rpt`**: possiamo avere il file .rpt (o una stampa d'esempio) per replicare il layout? È la ricevuta da consegnare al cliente?
14. **Classe inesistente**: è normale registrare schede per classi senza lista adozioni (es. lista non ancora pubblicata)? Cosa si fa dopo, si reimporta?
15. **Più postazioni**: il gestionale è usato da più PC contemporaneamente (rischio numeri doppi)?
16. **Contatori magazzino**: i valori attuali di `qta_prenotata_*`/`qta_locale_*` sono considerati affidabili, o vanno ricalcolati in migrazione dai dettagli di Clienti/Ordini/Bolle?
