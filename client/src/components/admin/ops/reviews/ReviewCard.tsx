"use client";

import Image from "next/image";
import { BadgeCheck, Check, EyeOff, Package, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import { productPath } from "@/lib/urls";
import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/ui/Stars";

export interface AdminReview {
  id: number;
  productId: number;
  userId: number | null;
  nome: string;
  voto: number;
  testo: string | null;
  approvata: boolean;
  createdAt: string;
  product: { id: number; titolo: string; immagine: string | null } | null;
}

export function ReviewCard({
  review,
  busy,
  onApprove,
  onHide,
  onDelete,
}: {
  review: AdminReview;
  busy: string | null;
  onApprove: () => void;
  onHide: () => void;
  onDelete: () => void;
}) {
  const product = review.product;
  const working = busy?.endsWith(`:${review.id}`);

  return (
    <article className="card flex flex-col p-5">
      {product ? (
        <a
          href={productPath(product)}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3"
          title="Apri il prodotto sul sito"
        >
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-paper-line bg-white">
            {product.immagine ? (
              <Image src={product.immagine} alt="" fill sizes="48px" className="object-contain p-1" />
            ) : (
              <span className="flex h-full items-center justify-center text-ink-faint">
                <Package className="h-5 w-5" />
              </span>
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-ink-muted">Prodotto</span>
            <span className="line-clamp-2 text-sm font-semibold text-ink group-hover:text-brand-600">{product.titolo}</span>
          </span>
        </a>
      ) : (
        <p className="text-sm text-ink-muted">Prodotto non più disponibile</p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <Stars value={review.voto} size={18} />
        <time dateTime={review.createdAt} className="text-xs text-ink-muted">
          {formatDate(review.createdAt)}
        </time>
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold">
        {review.nome}
        {review.userId && (
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-700" title="Recensione di un cliente registrato">
            <BadgeCheck className="h-3.5 w-3.5" /> Cliente registrato
          </span>
        )}
      </p>
      <p className="mt-2 flex-1 whitespace-pre-line break-words text-[15px] leading-relaxed text-ink-soft">
        {review.testo || <em className="text-ink-muted">Solo voto, nessun commento.</em>}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-paper-line pt-4">
        {review.approvata ? (
          <Button variant="outline" size="sm" onClick={onHide} loading={busy === `hide:${review.id}`} disabled={working}>
            {busy !== `hide:${review.id}` && <EyeOff className="h-4 w-4" />}
            Nascondi
          </Button>
        ) : (
          <Button size="sm" onClick={onApprove} loading={busy === `approve:${review.id}`} disabled={working}>
            {busy !== `approve:${review.id}` && <Check className="h-4 w-4" />}
            Approva e pubblica
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-magenta-ink hover:bg-magenta-soft hover:text-magenta-ink"
          onClick={onDelete}
          loading={busy === `delete:${review.id}`}
          disabled={working}
        >
          {busy !== `delete:${review.id}` && <Trash2 className="h-4 w-4" />}
          Elimina
        </Button>
      </div>
    </article>
  );
}
