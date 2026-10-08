import type { Metadata } from "next";
import { PageHeader } from "@/components/shop/PageHeader";
import { WishlistView } from "@/components/account/WishlistView";

export const metadata: Metadata = {
  title: "I tuoi preferiti",
  description: "I prodotti che hai salvato su Cartoleria Bambù: ritrovali tutti in un'unica lista.",
  alternates: { canonical: "/preferiti" },
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <>
      <PageHeader
        title="I tuoi preferiti"
        subtitle="Tutto quello che ti è piaciuto, in un'unica lista. Pronto quando lo sei tu."
      />
      <div className="container py-8 sm:py-12">
        <WishlistView />
      </div>
    </>
  );
}
