import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/shop/PageHeader";

export const metadata: Metadata = {
  title: "Termini e condizioni",
  description:
    "Termini e condizioni di vendita e utilizzo del sito web di Cartoleria Bambù",
  alternates: { canonical: "/terms" },
  robots: {
    index: true,
    follow: true,
  },
};

// Indice delle sezioni (il testo legale qui sotto resta invariato)
const TOC = [
  { id: "panoramica", label: "Panoramica" },
  { id: "sezione-1", label: "1. Termini e condizioni del negozio online" },
  { id: "sezione-2", label: "2. Condizioni generali" },
  { id: "sezione-3", label: "3. Precisione, completezza e tempestività delle informazioni" },
  { id: "sezione-4", label: "4. Modifiche al servizio e ai prezzi" },
  { id: "sezione-5", label: "5. Prodotti o servizi" },
  { id: "sezione-6", label: "6. Accuratezza delle informazioni di fatturazione e dell'account" },
  { id: "sezione-7", label: "7. Strumenti opzionali" },
  { id: "sezione-8", label: "8. Link di terze parti" },
  { id: "sezione-9", label: "9. Commenti, feedback e altri materiali inviati" },
  { id: "sezione-10", label: "10. Informazioni personali" },
  { id: "sezione-11", label: "11. Errori, inesattezze e omissioni" },
  { id: "sezione-12", label: "12. Usi proibiti" },
  { id: "sezione-13", label: "13. Esclusione di garanzie; limitazione di responsabilità" },
  { id: "sezione-14", label: "14. Indennizzo" },
  { id: "sezione-15", label: "15. Separabilità" },
];

function TocList() {
  return (
    <ol className="space-y-1 text-sm">
      {TOC.map((t) => (
        <li key={t.id}>
          <a
            href={`#${t.id}`}
            className="block rounded-lg px-2 py-1.5 leading-snug text-ink-muted transition hover:bg-paper hover:text-ink"
          >
            {t.label}
          </a>
        </li>
      ))}
    </ol>
  );
}

export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Termini e Condizioni del Servizio"
        subtitle="Le condizioni di vendita e di utilizzo del sito Cartoleria Bambù."
        crumbs={[{ label: "Termini e condizioni" }]}
      />

      <div className="container grid gap-8 py-10 sm:py-14 lg:grid-cols-[280px_1fr] lg:gap-12">
        <nav aria-label="Indice dei termini" className="hidden lg:block">
          <div className="sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto rounded-3xl border border-paper-line bg-white p-4">
            <p className="px-2 pb-2 text-xs font-extrabold uppercase tracking-wider text-ink-faint">Indice</p>
            <TocList />
          </div>
        </nav>

        <div className="min-w-0">
          <details className="group mb-5 rounded-3xl border border-paper-line bg-white p-4 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-2 font-bold [&::-webkit-details-marker]:hidden">
              Indice delle sezioni
              <ChevronDown className="h-5 w-5 text-ink-muted transition group-open:rotate-180" aria-hidden />
            </summary>
            <nav aria-label="Indice dei termini" className="mt-3">
              <TocList />
            </nav>
          </details>

          <article className="prose-bambu rounded-3xl border border-paper-line bg-white p-6 sm:p-10 lg:p-12 [&>section:first-child>h2]:mt-0">
            <section id="panoramica" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                PANORAMICA
              </h2>
              <p>
                Questo sito web è gestito da Cartoleria Bambù. I termini
                &quot;noi&quot; e &quot;nostro&quot; all&apos;interno del sito
                si riferiscono a Cartoleria Bambù. Cartoleria Bambù ti offre
                questo sito web con tutte le informazioni, gli strumenti e i
                servizi in esso disponibili a condizione che tu, in qualità di
                utente, accetti tutti i termini, le condizioni, le informative e
                le avvertenze qui riportate.
              </p>
              <p>
                Visitando il nostro sito e/o acquistando qualcosa da noi,
                usufruisci del nostro &quot;Servizio&quot; e accetti di essere
                vincolato dai seguenti termini e condizioni (&quot;Termini e
                condizioni del servizio&quot;, &quot;Termini&quot;), che
                includono i termini, le condizioni e le informative aggiuntive
                citate nel presente documento e/o disponibili tramite
                collegamento ipertestuale. I presenti Termini e condizioni del
                servizio si applicano a tutti gli utenti del sito, compresi a
                titolo esemplificativo e non esaustivo visitatori, fornitori,
                clienti, commercianti e/o autori di commenti e altri contenuti.
              </p>
              <p>
                Leggi con attenzione questi Termini e condizioni del servizio
                prima di accedere o utilizzare il nostro sito web. Accedendo o
                utilizzando qualsiasi parte del sito, accetti di essere
                vincolato dai presenti Termini e condizioni del servizio. Se non
                accetti integralmente i termini e le condizioni del presente
                accordo, non puoi accedere al sito web né utilizzare i suoi
                servizi. Se i presenti Termini e condizioni del servizio vengono
                considerati una proposta, l&apos;accettazione è espressamente
                limitata ai Termini stessi.
              </p>
              <p>
                Eventuali nuove funzionalità e strumenti aggiunti
                all&apos;attuale negozio saranno anch&apos;essi soggetti ai
                Termini e condizioni del servizio. Puoi consultare la versione
                più recente dei Termini e condizioni del servizio in qualsiasi
                momento su questa pagina. Ci riserviamo il diritto di
                aggiornare, modificare o sostituire qualsiasi parte dei Termini
                e condizioni del servizio pubblicando aggiornamenti e/o
                modifiche sul nostro sito web. È tua responsabilità controllare
                periodicamente questa pagina per vedere se sono presenti delle
                modifiche. La prosecuzione dell&apos;utilizzo o
                dell&apos;accesso al sito web dopo la pubblicazione di eventuali
                modifiche equivale all&apos;accettazione di tali modifiche.
              </p>
            </section>

            <section id="sezione-1" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 1 - TERMINI E CONDIZIONI DEL NEGOZIO ONLINE
              </h2>
              <p>
                Accettando i presenti Termini e condizioni del servizio,
                dichiari di avere almeno la maggiore età nel tuo stato o
                provincia di residenza, o che hai la maggiore età nel tuo stato
                o provincia di residenza e ci hai autorizzato a consentire a
                qualsiasi minore sotto la tua responsabilità di utilizzare
                questo sito.
              </p>
              <p>
                Non puoi utilizzare i nostri prodotti per scopi illegali o non
                autorizzati né puoi, nell&apos;uso del Servizio, violare alcuna
                legge vigente nel tuo ordinamento (incluse a puro titolo
                esemplificativo le leggi sul copyright).
              </p>
              <p>
                Non ti è consentito diffondere worm, virus o altri tipi di
                codice dannoso.
              </p>
              <p>
                La violazione di una qualsiasi disposizione dei Termini
                comporterà l&apos;immediata cessazione del tuo diritto a usare i
                Servizi.
              </p>
            </section>

            <section id="sezione-2" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 2 - CONDIZIONI GENERALI
              </h2>
              <p>
                Ci riserviamo il diritto di negare il servizio a chiunque, per
                qualsiasi motivo e in qualsiasi momento.
              </p>
              <p>
                Comprendi che i tuoi contenuti (ad eccezione dei dati della
                carta di credito) possono essere trasferiti in chiaro e
                implicano (a) trasmissioni su varie reti; e (b) modifiche per
                conformarsi e adattarsi ai requisiti tecnici delle reti o dei
                dispositivi di connessione. I dati delle carte di credito
                vengono sempre crittografati durante il trasferimento sulle
                reti.
              </p>
              <p>
                Accetti di non riprodurre, duplicare, copiare, vendere,
                rivendere o sfruttare alcuna parte del Servizio, né l&apos;uso
                del Servizio, l&apos;accesso al Servizio o qualsiasi contatto
                sul sito web attraverso il quale il servizio è fornito senza
                espressa autorizzazione scritta da parte nostra.
              </p>
              <p>
                I titoli utilizzati nel presente accordo sono inclusi solo per
                comodità e non limiteranno né influenzeranno in alcun modo i
                presenti Termini.
              </p>
            </section>

            <section id="sezione-3" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 3 - PRECISIONE, COMPLETEZZA E TEMPESTIVITÀ DELLE
                INFORMAZIONI
              </h2>
              <p>
                Non saremo responsabili nel caso in cui le informazioni rese
                disponibili su questo sito non dovessero risultare accurate,
                complete o aggiornate. I materiali su questo sito sono da
                intendersi come puramente indicativi e non dovranno essere presi
                a riferimento o utilizzati come unica base per prendere
                decisioni senza consultare fonti di informazione più autorevoli,
                accurate, complete o aggiornate. Facendo affidamento sulle
                informazioni di questo sito te ne assumi il rischio.
              </p>
              <p>
                Questo sito può contenere alcune informazioni di carattere
                storico. Le informazioni storiche, necessariamente, non sono
                attuali e sono fornite solo come riferimento. Ci riserviamo il
                diritto di modificare i contenuti di questo sito in qualsiasi
                momento, ma non siamo soggetti all&apos;obbligo di aggiornare
                alcuna informazione sul nostro sito. Accetti che è tua
                responsabilità monitorare le modifiche al nostro sito.
              </p>
            </section>

            <section id="sezione-4" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 4 - MODIFICHE AL SERVIZIO E AI PREZZI
              </h2>
              <p>
                I prezzi dei nostri prodotti sono soggetti a modifiche senza
                preavviso.
              </p>
              <p>
                Ci riserviamo il diritto di modificare o interrompere il
                Servizio (o qualsiasi sua parte o contenuto) senza preavviso in
                qualsiasi momento.
              </p>
              <p>
                Non saremo responsabili nei confronti tuoi o di terze parti per
                eventuali modifiche, variazioni di prezzo, sospensioni o
                interruzioni del Servizio.
              </p>
            </section>

            <section id="sezione-5" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 5 - PRODOTTI O SERVIZI
              </h2>
              <p>
                Alcuni prodotti o servizi possono essere disponibili
                esclusivamente online tramite il sito web. Questi prodotti o
                servizi possono essere disponibili in quantità limitate, ed
                essere soggetti a reso o sostituzione solo in base alla nostra
                Informativa su rimborsi e resi.
              </p>
              <p>
                Abbiamo fatto ogni sforzo possibile per mostrare colori e
                immagini fedeli dei prodotti presenti nel negozio. Tuttavia non
                possiamo garantire che i colori visualizzati sullo schermo del
                tuo computer siano accurati.
              </p>
              <p>
                Ci riserviamo il diritto (anche se non siamo obbligati a farlo)
                di limitare la vendita dei nostri prodotti o Servizi nei
                confronti di qualsiasi soggetto, area geografica o
                giurisdizione. Potremo esercitare questo diritto caso per caso.
                Ci riserviamo il diritto di limitare la quantità di prodotti o
                servizi che offriamo. Le descrizioni e i prezzi dei prodotti
                potranno subire modifiche in qualsiasi momento senza alcun
                preavviso, a nostra esclusiva discrezione.
              </p>
              <p>
                Ci riserviamo il diritto di interrompere in ogni momento la
                vendita di un qualsiasi prodotto. La vendita di qualsiasi
                prodotto o servizio tramite questo sito è da considerarsi nulla
                laddove sia proibita.
              </p>
              <p>
                Non garantiamo che la qualità di prodotti, servizi, informazioni
                o altri materiali da te acquistati o ottenuti soddisfi le tue
                aspettative, né che gli eventuali errori del Servizio vengano
                corretti.
              </p>
            </section>

            <section id="sezione-6" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 6 - ACCURATEZZA DELLE INFORMAZIONI DI FATTURAZIONE E
                DELL&apos;ACCOUNT
              </h2>
              <p>
                Ci riserviamo il diritto di rifiutare qualsiasi ordine ricevuto.
                A nostra esclusiva discrezione potremo limitare o annullare le
                quantità acquistate per persona, per nucleo familiare o per
                ordine. Queste restrizioni potranno riguardare gli ordini
                effettuati dallo stesso account cliente, con la stessa carta di
                credito e/o gli ordini che utilizzano lo stesso indirizzo di
                fatturazione e/o di spedizione. In caso di modifica o
                annullamento di un ordine, potremo tentare di avvisarti tramite
                l&apos;indirizzo email, l&apos;indirizzo di fatturazione o il
                numero di telefono forniti al momento dell&apos;ordine. Ci
                riserviamo il diritto di limitare o vietare ordini che a nostro
                insindacabile giudizio sembrino effettuati da grossisti,
                rivenditori o distributori.
              </p>
              <p>
                Accetti di fornire informazioni aggiornate, complete e accurate
                sull&apos;acquisto e sull&apos;account per tutti gli acquisti
                effettuati nel nostro negozio. Accetti di aggiornare
                tempestivamente il tuo account e altri dettagli, come
                l&apos;indirizzo email, il numero e la data di scadenza delle
                carte di credito, in modo che possiamo completare le transazioni
                e contattarti se necessario.
              </p>
              <p>
                Per maggiori informazioni, consulta la nostra Informativa su
                rimborsi e resi.
              </p>
            </section>

            <section id="sezione-7" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 7 - STRUMENTI OPZIONALI
              </h2>
              <p>
                Potremo fornirti l&apos;accesso a strumenti di terze parti che
                non monitoriamo e sui quali non abbiamo alcuna forma di
                controllo o gestione.
              </p>
              <p>
                Riconosci e accetti che forniamo l&apos;accesso a tali strumenti
                &quot;così come sono&quot; e &quot;come disponibili&quot;, senza
                alcun tipo di garanzia, dichiarazione, condizione o avallo. Non
                avremo alcuna responsabilità derivante da o relativa al tuo
                utilizzo di strumenti opzionali di terze parti.
              </p>
              <p>
                Qualsiasi utilizzo da parte tua degli strumenti opzionali
                offerti attraverso il sito avverrà interamente a tuo rischio e
                discrezione. Starà a te assicurarti di conoscere e approvare i
                termini e le condizioni a cui sono soggetti gli strumenti di
                terze parti.
              </p>
              <p>
                In futuro potremo anche offrire nuovi servizi e/o funzionalità
                attraverso il sito web (ad esempio, introducendo nuovi strumenti
                e risorse). Anche tali nuove funzionalità e/o servizi saranno
                soggetti ai presenti Termini e condizioni del servizio.
              </p>
            </section>

            <section id="sezione-8" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 8 - LINK DI TERZE PARTI
              </h2>
              <p>
                Alcuni contenuti, prodotti e servizi disponibili tramite il
                nostro Servizio possono includere materiali di terze parti.
              </p>
              <p>
                I link di terze parti su questo sito potranno indirizzarti a
                siti web esterni, che non sono affiliati con noi. Noi non siamo
                responsabili di esaminare o valutare i contenuti o
                l&apos;esattezza di tali siti web. E non forniamo alcuna
                garanzia né abbiamo alcuna responsabilità per materiali o siti
                web di terze parti né per altri materiali, prodotti o servizi di
                terze parti.
              </p>
              <p>
                Non risponderemo di eventuali danni connessi all&apos;acquisto o
                all&apos;utilizzo di beni, servizi, risorse, contenuti o a
                qualsiasi altra transazione effettuata attraverso siti web di
                terze parti. Esamina attentamente le policy e le procedure di
                terze parti e assicurati di averle comprese prima di effettuare
                qualsiasi transazione. Reclami, richieste, dubbi e domande sui
                prodotti di terze parti dovranno essere indirizzati ai terzi
                interessati.
              </p>
            </section>

            <section id="sezione-9" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 9 - COMMENTI, FEEDBACK E ALTRI MATERIALI INVIATI
              </h2>
              <p>
                Se ci invii online, via email, tramite posta ordinaria o in
                altro modo determinati materiali (congiuntamente denominati
                &quot;commenti&quot;) — ad esempio, su nostra richiesta,
                contributi per la partecipazione a concorsi, oppure senza una
                nostra richiesta, idee creative, suggerimenti, proposte, piani o
                altri materiali — accetti che possiamo in qualsiasi momento e
                senza limitazioni modificare, copiare, pubblicare, distribuire,
                tradurre o utilizzare in qualsiasi altro modo e con qualsiasi
                mezzo i commenti che ci trasmetti. Non abbiamo e non avremo
                alcun obbligo di (1) mantenere riservati i commenti; (2) pagare
                compensi per i commenti; o (3) rispondere ai commenti.
              </p>
              <p>
                Potremo (senza avere alcun obbligo al riguardo) monitorare,
                modificare e rimuovere contenuti che dovessimo a nostra
                esclusiva discrezione ritenere illeciti, offensivi, minacciosi,
                calunniosi, diffamatori, pornografici, osceni o altrimenti
                discutibili, o contenuti che violino la proprietà intellettuale
                di qualsiasi parte o i presenti Termini e condizioni del
                servizio.
              </p>
              <p>
                Accetti di evitare commenti che ledano i diritti di terze parti,
                tra cui copyright, marchi commerciali, diritto alla privacy,
                diritti della personalità e altri diritti reali o personali.
                Inoltre accetti di non inviare commenti che contengano materiale
                diffamatorio o altrimenti illegale, offensivo o obsceno, oppure
                virus informatici o altri malware che rischiano di compromettere
                il funzionamento del Servizio o di qualsiasi sito web correlato.
                Non potrai utilizzare un indirizzo email falso, fingere di
                essere qualcun altro o altrimenti fuorviare noi o terze parti
                sull&apos;origine di eventuali commenti. Sei l&apos;unico
                responsabile dei commenti che invii e della loro accuratezza.
                Non ci assumiamo e non avremo alcuna responsabilità per
                eventuali commenti pubblicati da te o da terze parti.
              </p>
            </section>

            <section id="sezione-10" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 10 - INFORMAZIONI PERSONALI
              </h2>
              <p>
                L&apos;invio di informazioni personali attraverso il negozio è
                regolato dalla nostra Informativa sulla privacy. Per
                visualizzare la nostra Informativa sulla privacy, consulta i
                link nel footer del sito.
              </p>
            </section>

            <section id="sezione-11" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 11 - ERRORI, INESATTEZZE E OMISSIONI
              </h2>
              <p>
                Occasionalmente possono essere presenti sul nostro sito o nel
                Servizio informazioni contenenti errori tipografici, inesattezze
                e omissioni riguardanti descrizioni dei prodotti, prezzi,
                promozioni, offerte, costi di spedizione, tempi di consegna o
                disponibilità dei prodotti. Ci riserviamo il diritto di
                correggere eventuali errori, inesattezze e omissioni modificando
                e aggiornando le informazioni o annullando gli ordini, se
                qualsiasi informazione nel Servizio o su un sito web correlato
                dovesse essere inaccurata, in ogni momento (anche dopo
                l&apos;invio dell&apos;ordine) e senza alcun preavviso.
              </p>
              <p>
                Non ci assumiamo alcun obbligo di aggiornare, correggere o
                chiarire le informazioni nel Servizio o in qualsiasi sito web
                correlato, incluse senza limitazioni le informazioni sui prezzi,
                salvo quanto previsto dalla legge. Nessuna data di aggiornamento
                specificata nel Servizio o in qualsiasi sito web correlato dovrà
                essere interpretata come garanzia che tutte le informazioni nel
                Servizio o in qualsiasi sito web correlato siano state corrette
                e aggiornate.
              </p>
            </section>

            <section id="sezione-12" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 12 - USI PROIBITI
              </h2>
              <p>
                Oltre agli altri divieti stabiliti nei Termini e condizioni del
                servizio, è vietato utilizzare il sito o il suo contenuto:
              </p>
              <ul>
                <li>(a) per scopi illegali;</li>
                <li>
                  (b) per indurre altri a compiere o partecipare ad atti
                  illeciti;
                </li>
                <li>
                  (c) per violare leggi e regolamenti internazionali, federali,
                  provinciali o statali, o ordinanze locali;
                </li>
                <li>
                  (d) per ledere o violare i diritti di proprietà intellettuale
                  nostri o di terzi;
                </li>
                <li>
                  (e) per molestare, abusare, insultare, danneggiare, diffamare,
                  calunniare, denigrare, intimidire o discriminare qualcuno in
                  base a sesso, orientamento sessuale, religione, etnia, età,
                  paese di origine o disabilità;
                </li>
                <li>(f) per fornire informazioni false o fuorvianti;</li>
                <li>
                  (g) per caricare o trasmettere virus o qualsiasi altro tipo di
                  codice dannoso idoneo a influire sulla funzionalità o sul
                  funzionamento del Servizio, di qualsiasi sito web correlato,
                  di altri siti web o di internet;
                </li>
                <li>
                  (h) per raccogliere o monitorare le informazioni personali di
                  altri utenti;
                </li>
                <li>
                  (i) per spam, phishing, pharming, pretexting, uso di spider,
                  crawling o scraping;
                </li>
                <li>(j) per qualsiasi scopo obsceno o immorale;</li>
                <li>
                  (k) per intralciare o aggirare le funzionalità di sicurezza
                  del Servizio o di qualsiasi sito web correlato, di altri siti
                  web o di internet.
                </li>
              </ul>
              <p>
                Ci riserviamo il diritto di interrompere il tuo utilizzo del
                Servizio o di qualsiasi sito web correlato se violi una
                qualsiasi delle disposizioni sugli usi proibiti.
              </p>
            </section>

            <section id="sezione-13" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 13 - ESCLUSIONE DI GARANZIE; LIMITAZIONE DI
                RESPONSABILITÀ
              </h2>
              <p>
                Non garantiamo, affermiamo o dichiariamo che l&apos;utilizzo del
                nostro servizio sarà ininterrotto, tempestivo, sicuro né privo
                di errori.
              </p>
              <p>
                Non garantiamo che i risultati raggiungibili con l&apos;uso del
                servizio siano accurati o affidabili.
              </p>
              <p>
                In nessun caso Cartoleria Bambù e i suoi amministratori,
                dirigenti, dipendenti, affiliati, agenti, appaltatori, stagisti,
                fornitori, fornitori di servizi o concessori di licenza saranno
                responsabili per qualsiasi pregiudizio, perdita, reclamo o per
                un danno diretto, indiretto, incidentale, punitivo, speciale o
                consequenziale di qualsiasi tipo — inclusi senza limitazione
                profitti persi, mancati guadagni, risparmi persi, perdita di
                dati, costi di sostituzione o altri danni simili, in virtù di
                contratto, illecito civile (anche dovuto a negligenza),
                responsabilità oggettiva o altro — derivante dall&apos;utilizzo
                di uno qualsiasi dei servizi o prodotti ottenuti utilizzando il
                servizio.
              </p>
              <p>
                Poiché alcuni stati o giurisdizioni non consentono
                l&apos;esclusione o la limitazione di responsabilità per danni
                conseguenti o incidentali, in tali stati o giurisdizioni la
                nostra responsabilità sarà limitata fino al limite massimo
                consentito dalla legge.
              </p>
            </section>

            <section id="sezione-14" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 14 - INDENNIZZO
              </h2>
              <p>
                Accetti di risarcire, difendere e tenere indenne Cartoleria
                Bambù e le sue imprese controllanti, controllate e affiliate,
                nonché i suoi partner, dirigenti, amministratori, agenti,
                appaltatori, concessori di licenza, fornitori di servizi,
                subappaltatori, fornitori, stagisti e dipendenti da qualsiasi
                rivendicazione o richiesta, incluse le spese legali in misura
                ragionevole, avanzata da qualsiasi soggetto terzo e dovuta o
                derivante dalla tua violazione dei presenti Termini e condizioni
                del servizio o dei documenti in essi incorporati mediante
                riferimento, o dalla tua violazione di qualsiasi legge o diritto
                di terze parti.
              </p>
            </section>

            <section id="sezione-15" className="scroll-mt-32">
              <h2 className="text-lg tracking-wide sm:text-xl">
                SEZIONE 15 - SEPARABILITÀ
              </h2>
              <p>
                Nel caso in cui una qualsiasi disposizione dei presenti Termini
                e condizioni del servizio sia ritenuta illegale, nulla o
                inapplicabile, tale disposizione sarà comunque applicabile nella
                misura massima consentita dalla legge vigente e la parte
                inapplicabile sarà considerata scissa dai presenti Termini e
                condizioni del servizio, senza pregiudizio per la validità e
                l&apos;applicabilità delle disposizioni rimanenti.
              </p>
            </section>

            <div className="mt-10 border-t border-paper-line pt-8">
              <div className="rounded-2xl bg-paper-warm p-5 text-[15px] [&_p]:my-1">
                <p>
                  <strong>Cartoleria Bambù</strong>
                </p>
                <p>Corso Umberto I, 367 - 80058 Torre Annunziata (NA)</p>
                <p>P.IVA: 10611291211</p>
                <p>Tel: 081 1997 0664</p>
                <p>Email: info@cartoleriabambù.com</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-ink-muted">
                Ultimo aggiornamento: 18 Luglio 2025
              </p>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
