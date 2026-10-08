"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, FileText, ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Post } from "@/lib/types";
import { api, errorMessage, revalidateStorefront } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { Button, LinkButton, buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { PageTitle } from "@/components/admin/PageTitle";
import { useConfirm } from "@/components/admin/useConfirm";
import { cn } from "@/lib/cn";
import { Callout } from "../Callout";
import { FilterTabs } from "../FilterTabs";
import { useAsync } from "../useAsync";

type Filter = "tutti" | "pubblicati" | "bozze";

export function PostBadge({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
        published ? "bg-brand-50 text-brand-700" : "bg-orange-soft text-orange-ink"
      )}
    >
      {published ? "Pubblicato" : "Bozza"}
    </span>
  );
}

export function PostsView() {
  const posts = useAsync(() => api<Post[]>("/posts/admin/all"), []);
  const { data, setData } = posts;
  const [filter, setFilter] = useState<Filter>("tutti");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const all = useMemo(() => data ?? [], [data]);
  const published = all.filter((p) => p.pubblicato).length;
  const list = all.filter((p) => filter === "tutti" || (filter === "pubblicati" ? p.pubblicato : !p.pubblicato));

  const remove = async (post: Post) => {
    const ok = await confirm({
      title: "Eliminare l'articolo?",
      message: (
        <p>
          «{post.titolo}» verrà eliminato definitivamente
          {post.pubblicato ? " e la sua pagina non sarà più raggiungibile" : ""}.
        </p>
      ),
      confirmLabel: "Elimina",
      danger: true,
    });
    if (!ok) return;
    setDeleting(post.id);
    try {
      await api(`/posts/${post.id}`, { method: "DELETE" });
      setData((prev) => prev?.filter((p) => p.id !== post.id) ?? prev);
      revalidateStorefront(["posts", `post:${post.slug}`]);
      toast.success("Articolo eliminato.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <PageTitle
        title="Blog"
        description="Articoli, guide e novità del negozio: fanno conoscere la cartoleria e aiutano a farsi trovare su Google."
        actions={
          <LinkButton href="/dashboard/blog/nuovo">
            <Plus className="h-4 w-4" /> Nuovo articolo
          </LinkButton>
        }
      />

      {data && all.length > 0 && (
        <FilterTabs
          className="mb-5"
          label="Filtra gli articoli"
          value={filter}
          onChange={setFilter}
          items={[
            { value: "tutti", label: "Tutti", count: all.length },
            { value: "pubblicati", label: "Pubblicati", count: published },
            { value: "bozze", label: "Bozze", count: all.length - published },
          ]}
        />
      )}

      {posts.error && !data ? (
        <Callout tone="danger" title="Impossibile caricare gli articoli">
          {posts.error}
        </Callout>
      ) : !data ? (
        <div className="space-y-3" aria-hidden>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileText className="h-7 w-7" />}
            title={all.length ? "Nessun articolo in questa sezione" : "Scrivi il tuo primo articolo"}
            text={
              all.length
                ? undefined
                : "Ad esempio: «Come scegliere lo zaino per la scuola» o «Le novità di settembre». Bastano un titolo, una foto e qualche paragrafo."
            }
            action={
              !all.length && (
                <LinkButton href="/dashboard/blog/nuovo">
                  <Plus className="h-4 w-4" /> Nuovo articolo
                </LinkButton>
              )
            }
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((post) => (
            <li key={post.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <Link
                href={`/dashboard/blog/${post.id}`}
                className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-paper-warm sm:w-44"
                tabIndex={-1}
                aria-hidden
              >
                {post.copertina ? (
                  <Image src={post.copertina} alt="" fill sizes="(min-width: 640px) 176px, 100vw" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-ink-faint">
                    <ImageIcon className="h-7 w-7" />
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <PostBadge published={post.pubblicato} />
                  <span className="text-xs text-ink-muted">
                    {post.pubblicato && post.publishedAt
                      ? `Pubblicato il ${formatDate(post.publishedAt)}`
                      : `Modificato il ${formatDate(post.updatedAt)}`}
                  </span>
                </div>
                <Link href={`/dashboard/blog/${post.id}`} className="mt-1.5 block text-lg font-bold leading-snug hover:text-brand-700">
                  {post.titolo}
                </Link>
                {post.estratto && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{post.estratto}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch lg:flex-row lg:items-center">
                <LinkButton href={`/dashboard/blog/${post.id}`} variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" /> Modifica
                </LinkButton>
                {post.pubblicato && (
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("outline", "sm")}
                  >
                    <ExternalLink className="h-4 w-4" /> Vedi sul sito
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-magenta-ink hover:bg-magenta-soft hover:text-magenta-ink"
                  onClick={() => remove(post)}
                  loading={deleting === post.id}
                >
                  {deleting !== post.id && <Trash2 className="h-4 w-4" />}
                  Elimina
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {confirmDialog}
    </div>
  );
}
