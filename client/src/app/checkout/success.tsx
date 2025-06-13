"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CheckoutSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("Sessione di pagamento non trovata.");
      setLoading(false);
      return;
    }
    // Qui potresti chiamare una API per confermare l'ordine lato backend
    setLoading(false);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-lg text-[#51946b] font-bold">
          Conferma pagamento in corso...
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-lg text-red-600 font-bold">{error}</div>
        <button
          className="mt-4 px-4 py-2 rounded-full bg-[#e8f2ec] text-[#51946b] font-semibold border border-[#51946b]"
          onClick={() => router.push("/")}
        >
          Torna alla home
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-2xl text-[#51946b] font-bold mb-4">
        Pagamento completato!
      </div>
      <div className="text-base text-[#111714] mb-6">
        Grazie per il tuo ordine. Riceverai una mail di conferma a breve.
      </div>
      <button
        className="px-4 py-2 rounded-full bg-[#51946b] text-white font-semibold hover:bg-[#3a7d5a] shadow"
        onClick={() => router.push("/")}
      >
        Torna alla home
      </button>
    </div>
  );
}
