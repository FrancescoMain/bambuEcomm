"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Inbox, MailQuestion, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { PageTitle } from "@/components/admin/PageTitle";
import { useConfirm } from "@/components/admin/useConfirm";
import { cn } from "@/lib/cn";
import { Callout } from "../Callout";
import { FilterTabs } from "../FilterTabs";
import { timeAgo } from "../dates";
import { useAsync } from "../useAsync";
import { useQueryParams } from "../useQueryParams";
import { MessageDetail } from "./MessageDetail";
import { CONTACT_TYPES, type ContactMessage, type ContactType, previewTitle } from "./messageUtils";

type Inboxes = Record<ContactType, ContactMessage[]>;

const loadInboxes = async (): Promise<Inboxes> => {
  const lists = await Promise.all(
    CONTACT_TYPES.map((t) => api<ContactMessage[]>("/contact", { query: { tipo: t.value } }))
  );
  return Object.fromEntries(CONTACT_TYPES.map((t, i) => [t.value, lists[i]])) as Inboxes;
};

export function MessagesView() {
  const [params, setParams] = useQueryParams();
  const tipoParam = params.get("tipo");
  const tipo: ContactType = CONTACT_TYPES.some((t) => t.value === tipoParam) ? (tipoParam as ContactType) : "contatto";
  const selectedId = parseInt(params.get("id") ?? "", 10) || null;
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const inboxes = useAsync(loadInboxes, []);
  const { data, setData } = inboxes;

  const all = useMemo(() => (data ? CONTACT_TYPES.flatMap((t) => data[t.value]) : []), [data]);
  const selected = selectedId ? all.find((m) => m.id === selectedId) ?? null : null;
  const list = useMemo(() => {
    const items = data?.[tipo] ?? [];
    return onlyUnread ? items.filter((m) => !m.letto || m.id === selectedId) : items;
  }, [data, tipo, onlyUnread, selectedId]);

  // Link diretto a un messaggio di un'altra scheda: allinea la scheda
  useEffect(() => {
    if (selected && selected.tipo !== tipo) setParams({ tipo: selected.tipo === "contatto" ? null : selected.tipo });
  }, [selected, tipo, setParams]);

  const patchLocal = useCallback(
    (id: number, patch: Partial<ContactMessage> | null) => {
      setData((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        for (const t of CONTACT_TYPES) {
          next[t.value] = patch
            ? prev[t.value].map((m) => (m.id === id ? { ...m, ...patch } : m))
            : prev[t.value].filter((m) => m.id !== id);
        }
        return next;
      });
    },
    [setData]
  );

  // Aprendo un messaggio non letto lo segniamo come letto (una sola volta per apertura)
  const autoRead = useRef<number | null>(null);
  useEffect(() => {
    if (!selected || selected.letto || autoRead.current === selected.id) return;
    autoRead.current = selected.id;
    patchLocal(selected.id, { letto: true });
    api(`/contact/${selected.id}`, { method: "PATCH", body: { letto: true } }).catch(() =>
      patchLocal(selected.id, { letto: false })
    );
  }, [selected, patchLocal]);

  const open = (m: ContactMessage) => setParams({ id: m.id });
  const close = () => setParams({ id: null });

  const toggleRead = async (m: ContactMessage) => {
    setBusy("read");
    try {
      await api(`/contact/${m.id}`, { method: "PATCH", body: { letto: !m.letto } });
      patchLocal(m.id, { letto: !m.letto });
      toast.success(m.letto ? "Segnato come da leggere." : "Segnato come letto.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (m: ContactMessage) => {
    const ok = await confirm({
      title: "Eliminare il messaggio?",
      message: `Il messaggio di ${m.nome} verrà eliminato definitivamente.`,
      confirmLabel: "Elimina",
      danger: true,
    });
    if (!ok) return;
    setBusy("delete");
    try {
      await api(`/contact/${m.id}`, { method: "DELETE" });
      patchLocal(m.id, null);
      close();
      toast.success("Messaggio eliminato.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const meta = CONTACT_TYPES.find((t) => t.value === tipo)!;

  return (
    <div>
      <PageTitle
        title="Messaggi"
        description="Le richieste arrivate dai moduli del sito: contatti, rivenditori e preventivi. Ricevi anche una copia via email."
        actions={
          <Button variant="outline" onClick={inboxes.reload} loading={inboxes.loading && !!data}>
            {!(inboxes.loading && data) && <RefreshCw className="h-4 w-4" />}
            Aggiorna
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs
          label="Tipo di messaggio"
          value={tipo}
          onChange={(value) => setParams({ tipo: value === "contatto" ? null : value, id: null })}
          items={CONTACT_TYPES.map((t) => ({
            value: t.value,
            label: t.label,
            count: data ? data[t.value].filter((m) => !m.letto).length : null,
            highlight: true,
          }))}
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink-soft">
          <input
            type="checkbox"
            checked={onlyUnread}
            onChange={(e) => setOnlyUnread(e.target.checked)}
            className="form-checkbox h-[18px] w-[18px] rounded-md border-paper-line text-brand-600 focus:ring-brand-500/30"
          />
          Solo da leggere
        </label>
      </div>
      <p className="mt-2 text-sm text-ink-muted">{meta.description}</p>

      {inboxes.error && !data ? (
        <Callout tone="danger" title="Impossibile caricare i messaggi" className="mt-5">
          {inboxes.error}
        </Callout>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div
            className={cn(
              "card overflow-hidden lg:max-h-[calc(100vh-15rem)] lg:min-h-[26rem] lg:overflow-y-auto",
              selected && "hidden lg:block"
            )}
          >
            {!data ? (
              <div className="space-y-3 p-4" aria-hidden>
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : list.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-7 w-7" />}
                title={onlyUnread ? "Tutto letto" : "Nessun messaggio"}
                text={onlyUnread ? "Non ci sono messaggi da leggere in questa sezione." : "Quando qualcuno compila il modulo lo trovi qui."}
              />
            ) : (
              <ul className="divide-y divide-paper-line">
                {list.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => open(m)}
                      aria-current={m.id === selectedId || undefined}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3.5 text-left transition hover:bg-paper",
                        m.id === selectedId && "bg-brand-50/70 hover:bg-brand-50"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn("mt-2 h-2.5 w-2.5 shrink-0 rounded-full", m.letto ? "bg-transparent" : "bg-brand-600")}
                      />
                      <span className="min-w-0 flex-1">
                        {!m.letto && <span className="sr-only">Da leggere: </span>}
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn("truncate text-[15px]", m.letto ? "font-semibold text-ink-soft" : "font-extrabold text-ink")}>
                            {m.nome}
                          </span>
                          <span className="shrink-0 text-xs text-ink-muted">{timeAgo(m.createdAt)}</span>
                        </span>
                        <span className={cn("block truncate text-sm", m.letto ? "text-ink-soft" : "font-semibold text-ink")}>
                          {previewTitle(m)}
                        </span>
                        <span className="line-clamp-2 text-sm text-ink-muted">{m.messaggio}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className={cn(
              "card overflow-hidden lg:max-h-[calc(100vh-15rem)] lg:min-h-[26rem] lg:overflow-y-auto",
              !selected && "hidden lg:block"
            )}
          >
            {selected ? (
              <MessageDetail
                message={selected}
                busy={busy}
                onBack={close}
                onToggleRead={() => toggleRead(selected)}
                onDelete={() => remove(selected)}
              />
            ) : (
              <EmptyState
                className="h-full justify-center"
                icon={<MailQuestion className="h-7 w-7" />}
                title={selectedId && data ? "Messaggio non trovato" : "Seleziona un messaggio"}
                text={selectedId && data ? "Potrebbe essere stato eliminato." : "Scegli un messaggio dall'elenco per leggerlo e rispondere."}
              />
            )}
          </div>
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
