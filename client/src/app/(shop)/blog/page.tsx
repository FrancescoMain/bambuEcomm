import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { getPosts } from "@/lib/api/server";
import { PageHeader } from "@/components/shop/PageHeader";
import { PostCard } from "@/components/shop/PostCard";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FeaturedPost } from "@/components/content/FeaturedPost";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Consigli, idee e novità dalla Cartoleria Bambù: come scegliere zaino e materiale per la scuola, idee regalo, creatività e organizzazione.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getPosts(48);
  const [first, ...others] = posts;

  return (
    <>
      <PageHeader
        title="Il blog di Bambù"
        subtitle="Consigli dal negozio, idee per la scuola e l'ufficio, novità e curiosità dal mondo della cartoleria."
        crumbs={[{ label: "Blog" }]}
      />
      <div className="container space-y-12 py-10 sm:space-y-16 sm:py-14">
        {!first ? (
          <EmptyState
            icon={<Newspaper className="h-7 w-7" aria-hidden />}
            title="Stiamo scrivendo i primi articoli"
            text="Torna a trovarci presto: in arrivo consigli e idee dalla cartoleria. Intanto dai un'occhiata alle novità."
            action={<LinkButton href="/novita">Scopri le novità</LinkButton>}
            className="rounded-3xl border border-dashed border-paper-line bg-white"
          />
        ) : (
          <>
            <FeaturedPost post={first} />
            {others.length > 0 && (
              <section>
                <SectionHeading title="Altri articoli" accent="bg-magenta" />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
