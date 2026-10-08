import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center py-24 text-center">
      <p className="text-7xl">🐼</p>
      <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Pagina non trovata</h1>
      <p className="mt-2 max-w-md text-ink-muted">
        Il panda ha cercato ovunque ma questa pagina non c&apos;è. Forse il prodotto non è più disponibile o il link è cambiato.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClass("primary")}>Torna alla home</Link>
        <Link href="/prodotti" className={buttonClass("outline")}>Sfoglia il catalogo</Link>
      </div>
    </div>
  );
}
