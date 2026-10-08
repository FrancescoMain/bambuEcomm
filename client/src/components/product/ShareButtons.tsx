"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { FacebookIcon, WhatsAppIcon } from "@/components/shop/icons";

export function ShareButtons({ url, title, image }: { url: string; title: string; image?: string | null }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-paper-line bg-white text-ink-soft transition hover:border-ink-faint hover:text-ink";
  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-sm font-semibold text-ink-muted">Condividi</span>
      <a className={btn} href={`https://wa.me/?text=${t}%20${u}`} target="_blank" rel="noopener noreferrer" aria-label="Condividi su WhatsApp">
        <WhatsAppIcon className="h-4 w-4" />
      </a>
      <a className={btn} href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer" aria-label="Condividi su Facebook">
        <FacebookIcon className="h-4 w-4" />
      </a>
      <a
        className={btn}
        href={`https://pinterest.com/pin/create/button/?url=${u}&description=${t}${image ? `&media=${encodeURIComponent(image)}` : ""}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Condividi su Pinterest"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M12 0a12 12 0 0 0-4.4 23.2c-.1-.9-.2-2.4 0-3.4l1.4-6s-.4-.7-.4-1.8c0-1.7 1-2.9 2.2-2.9 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.2 0 3.8-2.3 3.8-5.6 0-2.9-2.1-5-5.1-5-3.5 0-5.5 2.6-5.5 5.3 0 1 .4 2.2.9 2.8.1.1.1.2.1.4l-.3 1.4c-.1.2-.2.3-.4.2-1.6-.7-2.5-3-2.5-4.9 0-4 2.9-7.6 8.3-7.6 4.4 0 7.8 3.1 7.8 7.3 0 4.4-2.8 7.9-6.6 7.9-1.3 0-2.5-.7-2.9-1.5l-.8 3c-.3 1.1-1.1 2.5-1.6 3.4A12 12 0 1 0 12 0z" />
        </svg>
      </a>
      <button
        type="button"
        className={btn}
        aria-label="Copia link"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            // clipboard non disponibile
          }
        }}
      >
        {copied ? <Check className="h-4 w-4 text-brand-600" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
