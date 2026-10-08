"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonClass } from "@/components/ui/Button";

export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container flex flex-col items-center py-24 text-center">
      <p className="text-6xl">✏️</p>
      <h1 className="mt-4 text-3xl font-extrabold">Qualcosa è andato storto</h1>
      <p className="mt-2 max-w-md text-ink-muted">Riprova tra qualche istante. Se il problema continua, contattaci su WhatsApp.</p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Riprova</Button>
        <Link href="/" className={buttonClass("outline")}>Torna alla home</Link>
      </div>
    </div>
  );
}
