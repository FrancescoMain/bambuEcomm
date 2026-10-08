"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { PageTitle } from "@/components/admin/PageTitle";
import { Callout } from "../Callout";
import { FilterTabs } from "../FilterTabs";
import { useAsync } from "../useAsync";
import { useQueryParams } from "../useQueryParams";
import {
  WITHDRAWAL_STATES,
  type WithdrawalRequest,
  type WithdrawalState,
  WithdrawalCard,
  isOpenWithdrawal,
} from "./WithdrawalCard";

type Tab = "da-gestire" | "chiuse" | "tutte";

const GUIDE_KEY = "bambu-admin-recessi-guida";

function HowItWorks() {
  // Aperta la prima volta; se la chiudi resta chiusa (preferenza di questo browser)
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem(GUIDE_KEY) === "0") setOpen(false);
    } catch {
      // storage non disponibile: resta aperta
    }
  }, []);

  return (
    <details
      className="group card overflow-hidden"
      open={open}
      onToggle={(e) => {
        const next = e.currentTarget.open;
        setOpen(next);
        try {
          localStorage.setItem(GUIDE_KEY, next ? "1" : "0");
        } catch {
          // ignora
        }
      }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2.5 font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-soft text-sky-ink">
            <RotateCcw className="h-[18px] w-[18px]" />
          </span>
          Come funziona il recesso
        </span>
        <span className="text-sm font-semibold text-ink-muted group-open:hidden">Mostra</span>
        <span className="hidden text-sm font-semibold text-ink-muted group-open:inline">Nascondi</span>
      </summary>
      <ol className="grid gap-3 border-t border-paper-line p-5 text-sm leading-relaxed text-ink-soft md:grid-cols-3">
        <li className="rounded-2xl bg-paper p-4">
          <p className="mb-1 font-bold text-ink">1. Il cliente ha 14 giorni</p>
          Dalla consegna può recedere senza dare spiegazioni, con il modulo «Recesso online». Ricevi un&apos;email e la richiesta
          compare qui. Sono esclusi i prodotti personalizzati.
        </li>
        <li className="rounded-2xl bg-paper p-4">
          <p className="mb-1 font-bold text-ink">2. Accetta e attendi il reso</p>
          Scrivi al cliente come restituire la merce (le spese di restituzione sono a suo carico) e imposta lo stato «Accettata». Puoi
          aspettare che la merce rientri, o la prova della spedizione, prima di rimborsare.
        </li>
        <li className="rounded-2xl bg-paper p-4">
          <p className="mb-1 font-bold text-ink">3. Rimborsa entro 14 giorni</p>
          Il rimborso va fatto entro 14 giorni dalla richiesta, con lo stesso metodo di pagamento. Rimborso totale: apri l&apos;ordine e
          usa «Annulla e rimborsa»; rimborso parziale: dalla{" "}
          <a
            href="https://dashboard.stripe.com/payments"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-semibold text-brand-700 hover:underline"
          >
            dashboard di Stripe <ExternalLink className="h-3 w-3" />
          </a>
          . Poi imposta «Rimborsata».
        </li>
      </ol>
      <p className="border-t border-paper-line px-5 py-3 text-xs text-ink-muted">
        Cambiare lo stato qui serve a tenere traccia delle pratiche: non invia email al cliente. Usa «Scrivi al cliente» per
        comunicare con lui.
      </p>
    </details>
  );
}

export function WithdrawalsView() {
  const [params, setParams] = useQueryParams();
  const tabParam = params.get("vista");
  const tab: Tab = tabParam === "chiuse" || tabParam === "tutte" ? tabParam : "da-gestire";
  const requests = useAsync(() => api<WithdrawalRequest[]>("/recesso"), []);
  const { data, setData } = requests;
  const [saving, setSaving] = useState<number | null>(null);

  const changeState = async (request: WithdrawalRequest, stato: WithdrawalState) => {
    setSaving(request.id);
    try {
      const updated = await api<Partial<WithdrawalRequest>>(`/recesso/${request.id}`, { method: "PATCH", body: { stato } });
      setData((prev) => prev?.map((r) => (r.id === request.id ? { ...r, ...updated, stato, order: r.order } : r)) ?? prev);
      const label = WITHDRAWAL_STATES.find((s) => s.value === stato)?.label ?? stato;
      toast.success(`Richiesta #${request.id}: ${label.toLowerCase()}.`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(null);
    }
  };

  const all = data ?? [];
  const open = all.filter(isOpenWithdrawal);
  const closed = all.filter((r) => !isOpenWithdrawal(r));
  const list = tab === "da-gestire" ? open : tab === "chiuse" ? closed : all;

  return (
    <div>
      <PageTitle
        title="Recessi"
        description="Le richieste di recesso (reso) inviate dai clienti con il modulo online."
        actions={
          <Button variant="outline" onClick={requests.reload} loading={requests.loading && !!data}>
            {!(requests.loading && data) && <RefreshCw className="h-4 w-4" />}
            Aggiorna
          </Button>
        }
      />

      <HowItWorks />

      <FilterTabs
        className="mt-6"
        label="Filtra le richieste"
        value={tab}
        onChange={(value) => setParams({ vista: value === "da-gestire" ? null : value })}
        items={[
          { value: "da-gestire", label: "Da gestire", count: data ? open.length : null, highlight: true },
          { value: "chiuse", label: "Chiuse", count: data ? closed.length : null },
          { value: "tutte", label: "Tutte", count: data ? all.length : null },
        ]}
      />

      <div className="mt-5 space-y-4">
        {requests.error && !data ? (
          <Callout tone="danger" title="Impossibile caricare le richieste">
            {requests.error}
          </Callout>
        ) : !data ? (
          Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)
        ) : list.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<RotateCcw className="h-7 w-7" />}
              title={tab === "da-gestire" ? "Nessuna richiesta da gestire" : "Nessuna richiesta"}
              text={
                tab === "da-gestire"
                  ? "Quando un cliente invia il modulo di recesso, la richiesta compare qui e ricevi un'email."
                  : "Qui trovi lo storico delle richieste di recesso."
              }
            />
          </div>
        ) : (
          list.map((request) => (
            <WithdrawalCard
              key={request.id}
              request={request}
              saving={saving === request.id}
              onChangeState={(stato) => changeState(request, stato)}
            />
          ))
        )}
      </div>
    </div>
  );
}
