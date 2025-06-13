"use client";

import { useRouter } from "next/navigation";

export default function CheckoutCancel() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-2xl text-red-600 font-bold mb-4">
        Pagamento annullato
      </div>
      <div className="text-base text-[#111714] mb-6">
        Il pagamento non è andato a buon fine o è stato annullato. Puoi
        riprovare dal carrello.
      </div>
      <button
        className="px-4 py-2 rounded-full bg-[#e8f2ec] text-[#51946b] font-semibold border border-[#51946b]"
        onClick={() => router.push("/cart")}
      >
        Torna al carrello
      </button>
    </div>
  );
}
