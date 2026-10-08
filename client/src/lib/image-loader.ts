"use client";

/**
 * Loader per next/image: le immagini Cloudinary vengono richieste già
 * ridimensionate e convertite (WebP/AVIF) direttamente a Cloudinary, così
 * non consumiamo l'ottimizzazione immagini di Vercel e il browser scarica
 * pochi KB invece dell'originale.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    const transform = `f_auto,q_${quality ?? "auto"},c_limit,w_${width}`;
    return src.replace(/\/upload\/(?:[a-z]_[^/]+\/)*/, `/upload/${transform}/`);
  }
  // Foto del negozio: esiste anche una versione da 800px per gli schermi piccoli
  const local = src.match(/^\/negozio\/([a-z0-9-]+)\.webp$/);
  if (local && width <= 828) return `/negozio/${local[1]}-800.webp`;
  // File statici e altri host: originale (il parametro serve solo a variare la cache)
  const sep = src.includes("?") ? "&" : "?";
  return `${src}${sep}w=${width}`;
}
