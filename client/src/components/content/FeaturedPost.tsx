import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/format";

/** L'articolo più recente del blog, in grande */
export function FeaturedPost({ post }: { post: Post }) {
  const href = `/blog/${post.slug}`;
  return (
    <article className="group grid overflow-hidden rounded-3xl border border-paper-line bg-white transition hover:shadow-lift md:grid-cols-2">
      <Link href={href} className="relative block aspect-[16/10] bg-paper-warm bg-confetti md:aspect-auto md:min-h-[340px]" tabIndex={-1} aria-hidden>
        {post.copertina ? (
          <Image
            src={post.copertina}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="-rotate-3 rounded-3xl bg-white p-4 shadow-lift transition duration-500 group-hover:rotate-0">
              <Image src="/logo-panda.png" alt="" width={1034} height={792} sizes="160px" className="h-auto w-36 sm:w-40" />
            </span>
          </span>
        )}
      </Link>
      <div className="flex flex-col justify-center gap-3 p-6 sm:p-10">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-faint">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
            Ultimo articolo
          </span>
          {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
        </p>
        <h2 className="text-balance text-2xl font-extrabold leading-tight sm:text-3xl">
          <Link href={href} className="hover:text-brand-700">
            {post.titolo}
          </Link>
        </h2>
        {post.estratto && <p className="text-[17px] leading-relaxed text-ink-muted">{post.estratto}</p>}
        <Link href={href} className="mt-2 inline-flex w-fit items-center gap-1.5 font-bold text-brand-700 hover:text-brand-800">
          Leggi l&apos;articolo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          <span className="sr-only">: {post.titolo}</span>
        </Link>
      </div>
    </article>
  );
}
