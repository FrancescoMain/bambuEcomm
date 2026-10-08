import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { getPost, getPosts } from "@/lib/api/server";
import { formatDate } from "@/lib/format";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/urls";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { PostCard } from "@/components/shop/PostCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { JsonLd } from "@/components/content/JsonLd";
import { Markdown } from "@/components/content/Markdown";
import { CtaBand, ctaGhostClass, ctaLightClass } from "@/components/content/CtaBand";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

// Articoli già pubblicati generati in anticipo; i nuovi al primo accesso
export async function generateStaticParams() {
  const posts = await getPosts(50);
  return posts.map((p) => ({ slug: p.slug }));
}

const description = (text: string | null | undefined, fallback: string) =>
  (text || fallback).replace(/[#*_>`\[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Articolo non trovato", robots: { index: false } };
  const desc = description(post.estratto, post.contenuto || post.titolo);
  return {
    title: post.titolo,
    description: desc,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      locale: "it_IT",
      siteName: SITE_NAME,
      title: post.titolo,
      description: desc,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt,
      images: post.copertina ? [{ url: post.copertina, alt: post.titolo }] : [{ url: "/bambu-logo.jpg", width: 629, height: 354, alt: SITE_NAME }],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, recent] = await Promise.all([getPost(slug), getPosts(4)]);
  if (!post) notFound();
  const others = recent.filter((p) => p.slug !== post.slug).slice(0, 3);
  const url = absoluteUrl(`/blog/${post.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.titolo,
    description: description(post.estratto, post.contenuto || post.titolo),
    ...(post.copertina ? { image: [post.copertina] } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    dateModified: post.updatedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    inLanguage: "it-IT",
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-bambu.png` },
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <article>
        <header className="bg-paper-warm bg-confetti">
          <div className="container max-w-3xl py-10 sm:py-14">
            <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.titolo }]} className="mb-5" />
            <h1 className="text-balance text-3xl font-extrabold leading-tight sm:text-5xl">{post.titolo}</h1>
            {post.estratto && <p className="mt-4 text-lg leading-relaxed text-ink-muted">{post.estratto}</p>}
            <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-ink-soft">
              {post.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-brand-600" aria-hidden />
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                </span>
              )}
              <span>di Cartoleria Bambù</span>
            </p>
          </div>
        </header>

        <div className="container max-w-3xl py-10 sm:py-12">
          {post.copertina && (
            <div className="relative -mt-2 mb-10 aspect-[16/9] overflow-hidden rounded-3xl bg-paper-warm shadow-card">
              <Image
                src={post.copertina}
                alt=""
                fill
                priority
                sizes="(min-width: 800px) 768px, 100vw"
                className="object-cover"
              />
            </div>
          )}
          <Markdown source={post.contenuto || ""} className="text-[17px] [&>*:first-child]:mt-0" />

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-paper-line pt-6">
            <Link href="/blog" className="inline-flex items-center gap-1.5 font-bold text-brand-700 hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Torna al blog
            </Link>
            {post.updatedAt && post.publishedAt && post.updatedAt.slice(0, 10) !== post.publishedAt.slice(0, 10) && (
              <p className="text-sm text-ink-muted">Aggiornato il {formatDate(post.updatedAt)}</p>
            )}
          </div>
        </div>
      </article>

      <div className="container space-y-14 pb-6">
        {others.length > 0 && (
          <section>
            <SectionHeading title="Continua a leggere" href="/blog" linkLabel="Tutti gli articoli" accent="bg-sky" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}
        <CtaBand title="Ti è venuta voglia di cartoleria?" text="Trovi tutto quello che serve per scuola, ufficio e tempo libero, online e in negozio.">
          <Link href="/prodotti" className={ctaLightClass}>
            Vai allo shop <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/novita" className={ctaGhostClass}>
            Le novità
          </Link>
        </CtaBand>
      </div>
    </>
  );
}
