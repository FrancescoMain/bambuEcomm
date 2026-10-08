import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { isValidImageSrc } from "./utils";

/** Miniatura prodotto quadrata con segnaposto se manca l'immagine */
export function ProductThumb({
  src,
  size = 48,
  className,
  dimmed,
}: {
  src: string | null | undefined;
  size?: number;
  className?: string;
  dimmed?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-paper-line bg-white",
        className
      )}
      style={{ width: size, height: size }}
    >
      {isValidImageSrc(src) ? (
        <Image src={src} alt="" fill sizes={`${size * 2}px`} className={cn("object-contain p-1", dimmed && "opacity-50")} />
      ) : (
        <ImageOff className="h-1/3 w-1/3 text-ink-faint" aria-hidden />
      )}
    </span>
  );
}
