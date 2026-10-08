import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <p className="text-6xl">🐼</p>
      <h1 className="mt-4 text-3xl font-extrabold">Pagina non trovata</h1>
      <Link href="/" className="mt-6 font-bold text-brand-600">
        Torna alla home
      </Link>
    </div>
  );
}
