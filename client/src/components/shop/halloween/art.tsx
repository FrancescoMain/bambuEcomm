// Illustrazioni del tema Halloween: SVG in linea, nessuna immagine da scaricare.

type ArtProps = { className?: string };

export function Pumpkin({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <path d="M33 14c0-5 2-8 6-10l2 3c-3 2-4 4-4 7z" fill="#4d7c2f" />
      <ellipse cx="20" cy="38" rx="14" ry="20" fill="#e8730c" />
      <ellipse cx="44" cy="38" rx="14" ry="20" fill="#e8730c" />
      <ellipse cx="32" cy="38" rx="13" ry="21" fill="#f68b1f" />
      <path d="M19 32l6-6 5 6zM34 32l5-6 6 6z" fill="#2b1206" />
      <path d="M18 44c4 6 24 6 28 0l-4 1-2 3-3-3-3 3-3-3-3 3-3-3-3 3-2-3z" fill="#2b1206" />
    </svg>
  );
}

export function Bat({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 64 32" className={className} aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M32 9c-1.5 0-2.4-2.6-3-5-.6 1.7-.8 3.1-.7 4.4C22 6 12 6 2 2c4 4 6 9 5 14 3.5-2 7.5-2 10.5 1 1-3.2 4-4.5 7-3.4 2.6 1 4.8 4.4 7.5 10.4 2.7-6 4.9-9.4 7.5-10.4 3-1.1 6 .2 7 3.4 3-3 7-3 10.5-1-1-5 1-10 5-14-10 4-20 4-26.3 6.4.1-1.3-.1-2.7-.7-4.4-.6 2.4-1.5 5-3 5z"
      />
    </svg>
  );
}

export function Moon({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <circle cx="32" cy="32" r="28" fill="#fde9b8" />
      <circle cx="22" cy="24" r="5" fill="#f5d48a" />
      <circle cx="40" cy="40" r="7" fill="#f5d48a" />
      <circle cx="42" cy="20" r="3" fill="#f5d48a" />
    </svg>
  );
}

/** Ragnatela d'angolo (in alto a destra) */
export function Cobweb({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M100 0L0 100M100 0L30 100M100 0L65 100M100 0L0 30M100 0L0 65" />
      <path d="M78 0q4 18 22 22M56 0q6 34 44 44M34 0q8 52 66 66M12 0q10 70 88 88" />
    </svg>
  );
}
