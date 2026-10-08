"use client";

import { useMemo, useState } from "react";
import { Download, Mail, MailCheck, MailX, Sparkles, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { PageTitle } from "@/components/admin/PageTitle";
import { StatCard } from "@/components/admin/StatCard";
import { useConfirm } from "@/components/admin/useConfirm";
import { cn } from "@/lib/cn";
import { Callout } from "../Callout";
import { FilterTabs } from "../FilterTabs";
import { SearchInput } from "../SearchInput";
import { downloadWithAuth } from "../download";
import { useAsync } from "../useAsync";

interface Subscriber {
  id: number;
  email: string;
  nome: string | null;
  attivo: boolean;
  createdAt: string;
}

type Filter = "tutti" | "attivi" | "disiscritti";
const PAGE = 50;

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
        active ? "bg-brand-50 text-brand-700" : "bg-paper-warm text-ink-muted"
      )}
    >
      {active ? <MailCheck className="h-3.5 w-3.5" /> : <MailX className="h-3.5 w-3.5" />}
      {active ? "Iscritto" : "Disiscritto"}
    </span>
  );
}

export function NewsletterView() {
  const subscribers = useAsync(() => api<Subscriber[]>("/newsletter/subscribers"), []);
  const { data, setData } = subscribers;
  const [filter, setFilter] = useState<Filter>("tutti");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const all = useMemo(() => data ?? [], [data]);
  const active = all.filter((s) => s.attivo).length;
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = all.filter((s) => s.attivo && new Date(s.createdAt).getTime() >= monthAgo).length;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter(
      (s) =>
        (filter === "tutti" || (filter === "attivi" ? s.attivo : !s.attivo)) &&
        (!term || s.email.toLowerCase().includes(term) || (s.nome ?? "").toLowerCase().includes(term))
    );
  }, [all, filter, q]);
  const visible = filtered.slice(0, shown);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await downloadWithAuth("/newsletter/subscribers?format=csv", `iscritti-newsletter-${today}.csv`);
      toast.success("File CSV scaricato.");
    } catch (e) {
      toast.error(errorMessage(e, "Esportazione non riuscita."));
    } finally {
      setExporting(false);
    }
  };

  const remove = async (s: Subscriber) => {
    const ok = await confirm({
      title: "Rimuovere l'iscritto?",
      message: (
        <p>
          <strong>{s.email}</strong> verrà cancellato definitivamente dall&apos;elenco. Fallo, ad esempio, se la persona ti chiede di
          eliminare i suoi dati.
        </p>
      ),
      confirmLabel: "Rimuovi",
      danger: true,
    });
    if (!ok) return;
    setDeleting(s.id);
    try {
      await api(`/newsletter/subscribers/${s.id}`, { method: "DELETE" });
      setData((prev) => prev?.filter((x) => x.id !== s.id) ?? prev);
      toast.success("Iscritto rimosso.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setDeleting(null);
    }
  };

  const deleteButton = (s: Subscriber) => (
    <Button
      variant="ghost"
      size="icon"
      className="text-ink-muted hover:bg-magenta-soft hover:text-magenta-ink"
      onClick={() => remove(s)}
      loading={deleting === s.id}
      aria-label={`Rimuovi ${s.email}`}
      title="Rimuovi"
    >
      {deleting !== s.id && <Trash2 className="h-4 w-4" />}
    </Button>
  );

  return (
    <div>
      <PageTitle
        title="Newsletter"
        description="Le persone che si sono iscritte alla newsletter dal sito."
        actions={
          <Button onClick={exportCsv} loading={exporting} disabled={!all.length}>
            {!exporting && <Download className="h-4 w-4" />}
            Esporta CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Iscritti attivi" value={data ? active : "—"} icon={<Users className="h-5 w-5" />} />
        <StatCard
          label="Nuovi ultimi 30 giorni"
          value={data ? recent : "—"}
          icon={<UserPlus className="h-5 w-5" />}
          tone="bg-sky-soft text-sky-ink"
        />
        <StatCard
          label="Disiscritti"
          value={data ? all.length - active : "—"}
          icon={<MailX className="h-5 w-5" />}
          tone="bg-paper-warm text-ink-muted"
        />
      </div>

      <Callout tone="info" title="Come inviare una newsletter" className="mt-5" icon={<Sparkles className="h-5 w-5" />}>
        <ol className="list-decimal space-y-0.5 pl-5">
          <li>Premi «Esporta CSV» per scaricare l&apos;elenco (si apre anche con Excel).</li>
          <li>
            Importalo in un servizio di email marketing come Brevo, Mailchimp o MailerLite (sezione «Contatti» → «Importa»).
          </li>
          <li>
            Invia solo a chi ha <strong>attivo = si</strong> e lascia sempre il link per disiscriversi, come richiesto dalla
            privacy.
          </li>
        </ol>
      </Callout>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterTabs
          label="Filtra gli iscritti"
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setShown(PAGE);
          }}
          items={[
            { value: "tutti", label: "Tutti", count: data ? all.length : null },
            { value: "attivi", label: "Iscritti", count: data ? active : null },
            { value: "disiscritti", label: "Disiscritti", count: data ? all.length - active : null },
          ]}
        />
        <SearchInput
          value={q}
          onChange={(value) => {
            setQ(value);
            setShown(PAGE);
          }}
          delay={150}
          label="Cerca un iscritto"
          placeholder="Cerca per email o nome"
          className="md:w-80"
        />
      </div>

      <div className="mt-4">
        {subscribers.error && !data ? (
          <Callout tone="danger" title="Impossibile caricare gli iscritti">
            {subscribers.error}
          </Callout>
        ) : !data ? (
          <div className="card space-y-3 p-4" aria-hidden>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Mail className="h-7 w-7" />}
              title={all.length ? "Nessun iscritto trovato" : "Ancora nessun iscritto"}
              text={
                all.length
                  ? "Prova a cambiare la ricerca o il filtro."
                  : "Chi si iscrive dal sito compare qui. Puoi attivare il popup di iscrizione da Impostazioni → Popup newsletter."
              }
            />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <ul className="divide-y divide-paper-line md:hidden">
              {visible.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.email}</p>
                    <p className="text-xs text-ink-muted">
                      {s.nome ? `${s.nome} · ` : ""}dal {formatDate(s.createdAt)}
                    </p>
                    <div className="mt-1.5">
                      <StatusPill active={s.attivo} />
                    </div>
                  </div>
                  {deleteButton(s)}
                </li>
              ))}
            </ul>
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-paper-line bg-paper text-xs font-bold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Nome
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Iscritto il
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Stato
                  </th>
                  <th scope="col" className="w-14 px-3 py-3">
                    <span className="sr-only">Azioni</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-line">
                {visible.map((s) => (
                  <tr key={s.id} className="hover:bg-paper">
                    <td className="px-4 py-2.5 font-semibold">
                      <a href={`mailto:${s.email}`} className="hover:text-brand-700 hover:underline">
                        {s.email}
                      </a>
                    </td>
                    <td className="px-3 py-2.5 text-ink-soft">{s.nome || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">{formatDate(s.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      <StatusPill active={s.attivo} />
                    </td>
                    <td className="px-3 py-1.5 text-right">{deleteButton(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > shown && (
              <div className="border-t border-paper-line p-3 text-center">
                <Button variant="ghost" size="sm" onClick={() => setShown((n) => n + PAGE)}>
                  Mostra altri ({filtered.length - shown})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      {confirmDialog}
    </div>
  );
}
