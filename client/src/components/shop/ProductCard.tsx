import Image from "next/image";
import Link from "next/link";
import type { CardProduct } from "@/lib/types";
import { productPath } from "@/lib/urls";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { WishlistButton } from "./WishlistButton";
import { QuickAddButton } from "./QuickAddButton";

const NEW_DAYS = 30;

export function ProductCard({ product, priority, className }: { product: CardProduct; priority?: boolean; className?: string }) {
  const href = productPath(product);
  const secondImage = product.immagini?.find((src) => src && src !== product.immagine);
  const isNew = Date.now() - new Date(product.createdAt).getTime() < NEW_DAYS * 86_400_000;
  const category = product.categoria[product.categoria.length - 1];

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-paper-line bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lift",
        className
      )}
    >
      <Link href={href} className="relative block aspect-square overflow-hidden bg-white" tabIndex={-1} aria-hidden>
        {product.immagine ? (
          <>
            <Image
              src={product.immagine}
              alt=""
              fill
              priority={priority}
              sizes="(min-width: 1280px) 280px, (min-width: 768px) 30vw, 50vw"
              className={cn(
                "object-contain p-3 transition duration-500",
                secondImage ? "group-hover:opacity-0" : "group-hover:scale-[1.04]",
                !product.available && "opacity-60"
              )}
            />
            {secondImage && (
              <Image
                src={secondImage}
                alt=""
                fill
                sizes="(min-width: 1280px) 280px, (min-width: 768px) 30vw, 50vw"
                className="object-contain p-3 opacity-0 transition duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-ink-faint">✏️</div>
        )}
      </Link>

      <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
        {product.inOfferta && product.scontoPercentuale ? (
          <Badge tone="sale">-{product.scontoPercentuale}%</Badge>
        ) : null}
        {!product.available ? <Badge tone="soldout">Esaurito</Badge> : isNew ? <Badge tone="new">Novità</Badge> : null}
      </div>
      <div className="absolute right-3 top-3 z-10">
        <WishlistButton productId={product.id} />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4 pt-3">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {product.marca || category?.name || " "}
        </p>
        <h3 className="line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] hover:text-brand-700">
            {product.titolo}
          </Link>
        </h3>
        <div className="relative z-10 mt-auto flex items-end justify-between gap-2 pt-2">
          <Price
            prezzo={product.prezzo}
            prezzoFinale={product.prezzoFinale}
            scontoPercentuale={product.scontoPercentuale}
            size="sm"
          />
          {product.available && !product.hasVariants ? (
            <QuickAddButton
              product={{
                id: product.id,
                titolo: product.titolo,
                immagine: product.immagine,
                prezzo: product.prezzo,
                prezzoFinale: product.prezzoFinale,
              }}
            />
          ) : product.available ? (
            <Link
              href={href}
              className="inline-flex h-10 items-center rounded-full border border-paper-line px-3.5 text-sm font-bold text-ink-soft transition hover:border-brand-500 hover:text-brand-700"
            >
              Scegli
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: CardProduct[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
