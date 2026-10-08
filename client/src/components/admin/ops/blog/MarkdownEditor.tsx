"use client";

import { useId, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import { Bold, Eye, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, PenLine, Quote } from "lucide-react";
import { toast } from "sonner";
import { errorMessage, uploadImage } from "@/lib/api/client";
import { cn } from "@/lib/cn";

type Edit = { value: string; start: number; end: number };

/** Applica una modifica mantenendo, dove possibile, l'annulla (Ctrl+Z) del browser */
function applyEdit(ta: HTMLTextAreaElement, replaceFrom: number, replaceTo: number, text: string, select: [number, number]) {
  ta.focus();
  ta.setSelectionRange(replaceFrom, replaceTo);
  let ok = false;
  try {
    ok = document.execCommand("insertText", false, text);
  } catch {
    ok = false;
  }
  return ok ? () => ta.setSelectionRange(select[0], select[1]) : null;
}

const ACTIONS = [
  { key: "bold", label: "Grassetto", shortcut: "Ctrl+B", icon: Bold },
  { key: "italic", label: "Corsivo", shortcut: "Ctrl+I", icon: Italic },
  { key: "heading", label: "Titolo di paragrafo", icon: Heading2 },
  { key: "list", label: "Elenco puntato", icon: List },
  { key: "ordered", label: "Elenco numerato", icon: ListOrdered },
  { key: "quote", label: "Citazione", icon: Quote },
  { key: "link", label: "Link", shortcut: "Ctrl+K", icon: Link2 },
] as const;

type ActionKey = (typeof ACTIONS)[number]["key"];

/**
 * Editor del testo degli articoli: Markdown con barra degli strumenti
 * (grassetto, titoli, elenchi, link, immagini) e anteprima.
 */
export function MarkdownEditor({
  value,
  onChange,
  label = "Testo dell'articolo",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const id = useId();
  const ta = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);

  const html = useMemo(() => (mode === "preview" ? marked.parse(value || "", { async: false, gfm: true }) : ""), [mode, value]);
  const words = useMemo(() => (value.trim() ? value.trim().split(/\s+/).length : 0), [value]);

  /** Sostituisce [from, to) con `text` e seleziona [selStart, selEnd) */
  const replace = (edit: (v: string, s: number, e: number) => { from: number; to: number; text: string; select: [number, number] }) => {
    const el = ta.current;
    if (!el) return;
    const { from, to, text, select } = edit(value, el.selectionStart, el.selectionEnd);
    const restore = applyEdit(el, from, to, text, select);
    if (restore) {
      requestAnimationFrame(restore);
      return;
    }
    // Fallback senza execCommand
    const next: Edit = { value: value.slice(0, from) + text + value.slice(to), start: select[0], end: select[1] };
    onChange(next.value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(next.start, next.end);
    });
  };

  const wrap = (before: string, after: string, placeholder: string) =>
    replace((v, s, e) => {
      const selected = v.slice(s, e) || placeholder;
      return { from: s, to: e, text: before + selected + after, select: [s + before.length, s + before.length + selected.length] };
    });

  const prefixLines = (prefix: (i: number) => string, matcher: RegExp) =>
    replace((v, s, e) => {
      const from = v.lastIndexOf("\n", s - 1) + 1;
      const endIdx = v.indexOf("\n", e);
      const to = endIdx === -1 ? v.length : endIdx;
      const lines = v.slice(from, to).split("\n");
      const all = lines.every((l) => matcher.test(l));
      const text = lines.map((l, i) => (all ? l.replace(matcher, "") : prefix(i) + l.replace(matcher, ""))).join("\n");
      return { from, to, text, select: [from, from + text.length] };
    });

  const run = (key: ActionKey) => {
    if (key === "bold") wrap("**", "**", "testo in grassetto");
    if (key === "italic") wrap("_", "_", "testo in corsivo");
    if (key === "heading") prefixLines(() => "## ", /^#{1,6}\s+/);
    if (key === "list") prefixLines(() => "- ", /^[-*]\s+/);
    if (key === "ordered") prefixLines((i) => `${i + 1}. `, /^\d+\.\s+/);
    if (key === "quote") prefixLines(() => "> ", /^>\s?/);
    if (key === "link")
      replace((v, s, e) => {
        const selected = v.slice(s, e) || "testo del link";
        const text = `[${selected}](https://)`;
        const urlStart = s + selected.length + 3;
        return { from: s, to: e, text, select: [urlStart, urlStart + "https://".length] };
      });
  };

  const insertImage = async (picked?: File) => {
    if (!picked) return;
    setUploading(true);
    try {
      const url = await uploadImage(picked, "blog");
      replace((v, s, e) => {
        const before = s > 0 && v[s - 1] !== "\n" ? "\n\n" : "";
        const text = `${before}![Descrizione dell'immagine](${url})\n`;
        const altStart = s + before.length + 2;
        return { from: s, to: e, text, select: [altStart, altStart + "Descrizione dell'immagine".length] };
      });
      toast.success("Immagine inserita: scrivi una breve descrizione al posto del testo selezionato.");
    } catch (e) {
      toast.error(errorMessage(e, "Caricamento non riuscito"));
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-paper-line bg-paper/70 px-3 py-2">
        <div role="tablist" aria-label="Modalità editor" className="flex rounded-full bg-paper-warm p-1">
          {(
            [
              ["write", "Scrivi", PenLine],
              ["preview", "Anteprima", Eye],
            ] as const
          ).map(([key, text, Icon]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              aria-controls={`${id}-${key}`}
              onClick={() => setMode(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
                mode === key ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              {text}
            </button>
          ))}
        </div>
        {mode === "write" && (
          <div role="toolbar" aria-label="Formattazione" className="flex flex-wrap items-center gap-0.5">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              const title = "shortcut" in action ? `${action.label} (${action.shortcut})` : action.label;
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => run(action.key)}
                  title={title}
                  aria-label={action.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition hover:bg-white hover:text-ink hover:shadow-sm"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </button>
              );
            })}
            <span className="mx-1 h-5 w-px bg-paper-line" aria-hidden />
            <button
              type="button"
              onClick={() => file.current?.click()}
              disabled={uploading}
              title="Inserisci un'immagine"
              aria-label="Inserisci un'immagine"
              className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-ink-soft transition hover:bg-white hover:text-ink hover:shadow-sm disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <ImagePlus className="h-[18px] w-[18px]" />}
              <span className="hidden sm:inline">Immagine</span>
            </button>
            <input ref={file} type="file" accept="image/*" hidden onChange={(e) => insertImage(e.target.files?.[0])} />
          </div>
        )}
      </div>

      <div id={`${id}-write`} role="tabpanel" hidden={mode !== "write"}>
        <label htmlFor={`${id}-ta`} className="sr-only">
          {label}
        </label>
        <textarea
          ref={ta}
          id={`${id}-ta`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            const key = e.key.toLowerCase();
            if (key === "b" || key === "i" || key === "k") {
              e.preventDefault();
              run(key === "b" ? "bold" : key === "i" ? "italic" : "link");
            }
          }}
          placeholder={
            "Scrivi qui il tuo articolo.\n\nLascia una riga vuota tra un paragrafo e l'altro.\n\n## Un titolo di paragrafo\n\n- un punto dell'elenco\n- un altro punto"
          }
          className="block min-h-[420px] w-full resize-y border-0 bg-white px-4 py-4 text-[15px] leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none focus:ring-0 focus-visible:ring-0 sm:px-5"
        />
      </div>
      <div id={`${id}-preview`} role="tabpanel" hidden={mode !== "preview"} className="min-h-[420px] bg-white px-4 py-5 sm:px-6">
        {value.trim() ? (
          <div className="prose-bambu max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="py-16 text-center text-sm text-ink-muted">Niente da mostrare: scrivi qualcosa nella scheda «Scrivi».</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-paper-line bg-paper/70 px-4 py-2 text-xs text-ink-muted">
        <span>
          Suggerimento: seleziona un testo e premi un pulsante per formattarlo. Una riga vuota crea un nuovo paragrafo.
        </span>
        <span className="font-semibold">
          {words} {words === 1 ? "parola" : "parole"} · {Math.max(1, Math.round(words / 200))} min di lettura
        </span>
      </div>
    </div>
  );
}
