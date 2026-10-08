"use client";

import { ArrowLeft, Mail, MailOpen, Phone, Reply, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { Button, buttonClass } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/shop/icons";
import { CopyButton } from "../CopyButton";
import { phoneHref, whatsappHref } from "../orders/orderUtils";
import { type ContactMessage, extraFields, replyHref, typeMeta } from "./messageUtils";

export function MessageDetail({
  message,
  busy,
  onBack,
  onToggleRead,
  onDelete,
}: {
  message: ContactMessage;
  busy: string | null;
  onBack: () => void;
  onToggleRead: () => void;
  onDelete: () => void;
}) {
  const extras = extraFields(message);
  const meta = typeMeta(message.tipo);

  return (
    <article className="flex h-full flex-col" aria-labelledby="message-title">
      <header className="border-b border-paper-line p-5">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" /> Tutti i messaggi
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-paper-warm px-2.5 py-1 text-xs font-bold text-ink-soft">{meta.singular}</span>
          {!message.letto && <span className="rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">Da leggere</span>}
        </div>
        <h2 id="message-title" className="mt-2.5 text-xl font-extrabold leading-tight">
          {message.oggetto || `Messaggio da ${message.nome}`}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Ricevuto il {formatDateTime(message.createdAt)}</p>
      </header>

      <div className="flex-1 space-y-5 p-5">
        <dl className="grid gap-x-6 gap-y-3 rounded-2xl border border-paper-line p-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Nome</dt>
            <dd className="font-semibold">{message.nome}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Email</dt>
            <dd className="flex items-center gap-1">
              <a href={`mailto:${message.email}`} className="truncate font-semibold text-brand-700 hover:underline">
                {message.email}
              </a>
              <CopyButton text={message.email} label="Copia email" iconOnly />
            </dd>
          </div>
          {message.telefono && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Telefono</dt>
              <dd>
                <a href={phoneHref(message.telefono)} className="font-semibold text-brand-700 hover:underline">
                  {message.telefono}
                </a>
              </dd>
            </div>
          )}
          {extras.map((field) => (
            <div key={field.key} className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{field.label}</dt>
              <dd className="flex items-center gap-1 font-semibold">
                <span className="break-words">{field.value}</span>
                {field.key === "partitaIva" && <CopyButton text={field.value} label="Copia partita IVA" iconOnly />}
              </dd>
            </div>
          ))}
        </dl>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Messaggio</h3>
          <p className="whitespace-pre-line break-words rounded-2xl bg-paper-warm/70 p-4 text-[15px] leading-relaxed text-ink">
            {message.messaggio}
          </p>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-paper-line p-4">
        <a href={replyHref(message)} className={buttonClass("primary", "sm")}>
          <Reply className="h-4 w-4" /> Rispondi via email
        </a>
        {message.telefono && (
          <>
            <a href={phoneHref(message.telefono)} className={buttonClass("outline", "sm")}>
              <Phone className="h-4 w-4" /> Chiama
            </a>
            <a
              href={whatsappHref(message.telefono, `Ciao ${message.nome.split(" ")[0]}, ti rispondo da Cartoleria Bambù.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("outline", "sm", "text-leaf-ink")}
            >
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp
            </a>
          </>
        )}
        <div className="flex flex-1 flex-wrap justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onToggleRead} loading={busy === "read"}>
            {busy !== "read" && (message.letto ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />)}
            {message.letto ? "Segna come da leggere" : "Segna come letto"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-magenta-ink hover:bg-magenta-soft hover:text-magenta-ink"
            onClick={onDelete}
            loading={busy === "delete"}
          >
            {busy !== "delete" && <Trash2 className="h-4 w-4" />}
            Elimina
          </Button>
        </div>
      </footer>
    </article>
  );
}
