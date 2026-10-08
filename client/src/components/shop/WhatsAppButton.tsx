import { whatsappUrl } from "@/lib/urls";
import { WhatsAppIcon } from "./icons";

export function WhatsAppButton({ number }: { number: string }) {
  if (!number) return null;
  return (
    <a
      href={whatsappUrl(number, "Ciao! Vorrei informazioni sui vostri prodotti")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Scrivici su WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lift transition hover:scale-105 print:hidden"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
