"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Post } from "@/lib/types";
import { api, errorMessage, revalidateStorefront } from "@/lib/api/client";
import { formatDateTime, slugify } from "@/lib/format";
import { Button, buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Spinner";
import { SingleImageUploader } from "@/components/admin/ImageUploader";
import { useConfirm } from "@/components/admin/useConfirm";
import { cn } from "@/lib/cn";
import { Callout } from "../Callout";
import { Toggle } from "../Toggle";
import { MarkdownEditor } from "./MarkdownEditor";
import { PostBadge } from "./PostsView";

type Draft = {
  titolo: string;
  slug: string;
  estratto: string;
  contenuto: string;
  copertina: string | null;
  pubblicato: boolean;
};

const EMPTY: Draft = { titolo: "", slug: "", estratto: "", contenuto: "", copertina: null, pubblicato: false };

const toDraft = (p: Post): Draft => ({
  titolo: p.titolo,
  slug: p.slug,
  estratto: p.estratto ?? "",
  contenuto: p.contenuto ?? "",
  copertina: p.copertina,
  pubblicato: p.pubblicato,
});

/** Durante la digitazione: minuscole e trattini, senza togliere il trattino finale */
const softSlug = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "");

export function PostEditor({ postId }: { postId?: number }) {
  const router = useRouter();
  const isNew = !postId;
  const slugId = useId();
  const [post, setPost] = useState<Post | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [confirm, confirmDialog] = useConfirm();

  useEffect(() => {
    if (!postId) return;
    let alive = true;
    api<Post>(`/posts/admin/${postId}`)
      .then((p) => {
        if (!alive) return;
        setPost(p);
        setDraft(toDraft(p));
      })
      .catch((e) => alive && setLoadError(errorMessage(e, "Articolo non trovato.")));
    return () => {
      alive = false;
    };
  }, [postId]);

  const baseline = useMemo(() => (post ? toDraft(post) : EMPTY), [post]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  // Avvisa prima di chiudere la scheda con modifiche non salvate
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const set = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch) as (keyof Draft)[]) delete next[key];
      return next;
    });
  };

  const setTitle = (titolo: string) => set(slugTouched ? { titolo } : { titolo, slug: slugify(titolo).slice(0, 120) });

  const validate = () => {
    const next: typeof errors = {};
    if (!draft.titolo.trim()) next.titolo = "Scrivi il titolo dell'articolo.";
    if (!draft.contenuto.trim()) next.contenuto = "Scrivi il testo dell'articolo.";
    if (!slugify(draft.slug || draft.titolo)) next.slug = "L'indirizzo deve contenere almeno una lettera o un numero.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      toast.error("Controlla i campi evidenziati.");
      return;
    }
    const slug = slugify(draft.slug || draft.titolo).slice(0, 120);
    const body: Record<string, unknown> = {
      titolo: draft.titolo.trim(),
      estratto: draft.estratto.trim(),
      contenuto: draft.contenuto,
      copertina: draft.copertina,
      pubblicato: draft.pubblicato,
    };
    if (isNew || slug !== post?.slug) body.slug = slug;

    setSaving(true);
    try {
      const saved = await api<Post>(isNew ? "/posts" : `/posts/${postId}`, { method: isNew ? "POST" : "PUT", body });
      const tags = ["posts", `post:${saved.slug}`];
      if (post && post.slug !== saved.slug) tags.push(`post:${post.slug}`);
      revalidateStorefront(tags);
      setPost(saved);
      setDraft(toDraft(saved));
      setSlugTouched(true);
      if (isNew) {
        toast.success(saved.pubblicato ? "Articolo pubblicato!" : "Bozza salvata.");
        router.replace(`/dashboard/blog/${saved.id}`);
      } else {
        toast.success(
          saved.pubblicato && !post?.pubblicato ? "Articolo pubblicato!" : !saved.pubblicato && post?.pubblicato ? "Articolo tornato in bozza: non è più visibile sul sito." : "Modifiche salvate."
        );
      }
    } catch (e) {
      const message = errorMessage(e, "Salvataggio non riuscito.");
      if (/slug|indirizzo/i.test(message)) setErrors((prev) => ({ ...prev, slug: message }));
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!post) return;
    const ok = await confirm({
      title: "Eliminare l'articolo?",
      message: `«${post.titolo}» verrà eliminato definitivamente.`,
      confirmLabel: "Elimina",
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await api(`/posts/${post.id}`, { method: "DELETE" });
      revalidateStorefront(["posts", `post:${post.slug}`]);
      toast.success("Articolo eliminato.");
      router.replace("/dashboard/blog");
    } catch (e) {
      toast.error(errorMessage(e));
      setDeleting(false);
    }
  };

  const goBack = async () => {
    if (dirty) {
      const ok = await confirm({
        title: "Uscire senza salvare?",
        message: "Le modifiche non salvate andranno perse.",
        confirmLabel: "Esci senza salvare",
        danger: true,
      });
      if (!ok) return;
    }
    router.push("/dashboard/blog");
  };

  if (loadError) {
    return (
      <div className="card">
        <EmptyState
          title="Articolo non trovato"
          text={loadError}
          action={
            <Link href="/dashboard/blog" className={buttonClass("outline")}>
              Torna al blog
            </Link>
          }
        />
      </div>
    );
  }

  if (!isNew && !post) {
    return (
      <div className="space-y-5" aria-label="Caricamento articolo">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Skeleton className="h-[34rem] rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const publicUrl = `/blog/${post?.slug ?? draft.slug}`;
  const saveLabel = draft.pubblicato ? (post?.pubblicato ? "Salva modifiche" : "Salva e pubblica") : "Salva bozza";

  return (
    <div className="pb-24 lg:pb-0">
      <button
        type="button"
        onClick={goBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Tutti gli articoli
      </button>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{isNew ? "Nuovo articolo" : "Modifica articolo"}</h1>
          {post && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              <PostBadge published={post.pubblicato} />
              <span>Ultima modifica: {formatDateTime(post.updatedAt)}</span>
            </div>
          )}
        </div>
        <div className="hidden gap-2 sm:flex">
          {post?.pubblicato && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("outline")}>
              <ExternalLink className="h-4 w-4" /> Vedi sul sito
            </a>
          )}
          <Button onClick={save} loading={saving} disabled={!dirty && !isNew}>
            {!saving && <Save className="h-4 w-4" />}
            {saveLabel}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <div className="card space-y-4 p-5">
            <Input
              label="Titolo"
              required
              value={draft.titolo}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Come scegliere lo zaino giusto per la scuola"
              maxLength={200}
              error={errors.titolo}
            />
            <div>
              <label htmlFor={slugId} className="field-label">
                Indirizzo della pagina
              </label>
              <div
                className={cn(
                  "field flex items-center gap-0 overflow-hidden p-0 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15",
                  errors.slug && "border-magenta"
                )}
              >
                <span className="shrink-0 self-stretch border-r border-paper-line bg-paper-warm px-3 py-2.5 text-sm text-ink-muted">
                  /blog/
                </span>
                <input
                  id={slugId}
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set({ slug: softSlug(e.target.value).slice(0, 120) });
                  }}
                  onBlur={() => set({ slug: slugify(draft.slug || draft.titolo).slice(0, 120) })}
                  placeholder="si-crea-dal-titolo"
                  spellCheck={false}
                  aria-invalid={!!errors.slug || undefined}
                  aria-describedby={`${slugId}-hint`}
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-[15px] text-ink focus:outline-none focus:ring-0 focus-visible:ring-0"
                />
              </div>
              <p id={`${slugId}-hint`} className={cn("mt-1.5 text-xs", errors.slug ? "text-magenta-ink" : "text-ink-muted")}>
                {errors.slug ??
                  (post?.pubblicato
                    ? "Attenzione: cambiando l'indirizzo di un articolo già pubblicato, i link condivisi in precedenza non funzioneranno più."
                    : "Si crea in automatico dal titolo; puoi accorciarlo. Solo lettere minuscole, numeri e trattini.")}
              </p>
            </div>
            <Textarea
              label="Riassunto"
              value={draft.estratto}
              onChange={(e) => set({ estratto: e.target.value })}
              maxLength={400}
              rows={3}
              className="[&_textarea]:min-h-[84px]"
              placeholder="Due righe che invogliano a leggere: compaiono nell'elenco degli articoli e su Google."
              hint={`${draft.estratto.length}/400 caratteri · compare nell'elenco del blog e nei risultati di Google.`}
            />
          </div>

          <div>
            <MarkdownEditor value={draft.contenuto} onChange={(contenuto) => set({ contenuto })} />
            {errors.contenuto && <p className="mt-1.5 text-xs text-magenta-ink">{errors.contenuto}</p>}
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section className="card space-y-4 p-5">
            <h2 className="text-base font-bold">Pubblicazione</h2>
            <Toggle
              checked={draft.pubblicato}
              onChange={(pubblicato) => set({ pubblicato })}
              label="Visibile sul sito"
              description={draft.pubblicato ? "Chiunque può leggerlo nella sezione Blog." : "Bozza: lo vedi solo tu."}
            />
            {post?.pubblicato && post.publishedAt && (
              <p className="text-xs text-ink-muted">Pubblicato il {formatDateTime(post.publishedAt)}</p>
            )}
            <Button className="hidden w-full sm:inline-flex" onClick={save} loading={saving} disabled={!dirty && !isNew}>
              {!saving && <Save className="h-4 w-4" />}
              {saveLabel}
            </Button>
            {dirty && !isNew && <p className="text-center text-xs font-semibold text-orange-ink">Modifiche non salvate</p>}
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="text-base font-bold">Immagine di copertina</h2>
            <SingleImageUploader
              value={draft.copertina}
              onChange={(copertina) => set({ copertina })}
              folder="blog"
              aspect="aspect-video"
            />
            <p className="text-xs text-ink-muted">Orizzontale (16:9), almeno 1200 px di larghezza. Compare in cima all&apos;articolo e nelle anteprime social.</p>
          </section>

          <Callout tone="neutral" title="Consigli per un buon articolo">
            <ul className="list-disc space-y-0.5 pl-4">
              <li>Un titolo chiaro, con le parole che le persone cercano su Google.</li>
              <li>Paragrafi brevi e qualche titolo di paragrafo.</li>
              <li>Aggiungi link ai prodotti o alle categorie del negozio.</li>
            </ul>
          </Callout>

          {post && (
            <Button
              variant="ghost"
              className="w-full text-magenta-ink hover:bg-magenta-soft hover:text-magenta-ink"
              onClick={remove}
              loading={deleting}
            >
              {!deleting && <Trash2 className="h-4 w-4" />}
              Elimina articolo
            </Button>
          )}
        </aside>
      </div>

      {/* Barra di salvataggio sempre visibile su telefono */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-paper-line bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
        {post?.pubblicato && (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "md", "px-4")} aria-label="Vedi sul sito">
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        <Button className="flex-1" onClick={save} loading={saving} disabled={!dirty && !isNew}>
          {!saving && <Save className="h-4 w-4" />}
          {saveLabel}
        </Button>
      </div>
      {confirmDialog}
    </div>
  );
}
