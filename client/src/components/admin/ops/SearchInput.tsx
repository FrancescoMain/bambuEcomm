"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

/** Campo di ricerca con attesa (debounce): cerca mentre si scrive senza una richiesta per ogni tasto */
export function SearchInput({
  value,
  onChange,
  placeholder = "Cerca…",
  label = "Cerca",
  delay = 350,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  delay?: number;
  className?: string;
}) {
  const [text, setText] = useState(value);
  const emitted = useRef(value);

  // Valore cambiato dall'esterno (es. link, pulsante "azzera")
  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    if (text === emitted.current) return;
    const id = setTimeout(() => {
      emitted.current = text;
      onChange(text);
    }, delay);
    return () => clearTimeout(id);
  }, [text, delay, onChange]);

  const emitNow = (next: string) => {
    emitted.current = next;
    setText(next);
    onChange(next);
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
      <input
        type="search"
        value={text}
        aria-label={label}
        placeholder={placeholder}
        enterKeyHint="search"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") emitNow(text);
          if (e.key === "Escape" && text) emitNow("");
        }}
        className="field pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => emitNow("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-muted transition hover:bg-paper-warm hover:text-ink"
          aria-label="Cancella la ricerca"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
