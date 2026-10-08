import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-paper-line bg-white transition hover:shadow-lift">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="relative aspect-[16/9] bg-paper-warm bg-confetti">
          {post.copertina && (
            <Image src={post.copertina} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
          )}
        </div>
        <div className="p-5">
          {post.publishedAt && <p className="text-xs font-semibold text-ink-faint">{formatDate(post.publishedAt)}</p>}
          <h3 className="mt-1 text-lg font-bold leading-snug group-hover:text-brand-700">{post.titolo}</h3>
          {post.estratto && <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{post.estratto}</p>}
        </div>
      </Link>
    </article>
  );
}
