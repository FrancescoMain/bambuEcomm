"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

/** Conto alla rovescia stagionale (es. rientro a scuola), attivabile dal pannello */
export function Countdown({ titolo, data, link }: { titolo: string; data: string; link: string }) {
  const target = new Date(data).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (now === null || target <= now) return null;
  const diff = target - now;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);

  return (
    <Link
      href={link || "/"}
      className="block bg-gradient-to-r from-orange via-magenta to-sky py-2 text-center text-sm font-bold text-white"
    >
      <span className="inline-flex items-center gap-2">
        <Clock className="h-4 w-4" />
        {titolo} ·{" "}
        <span className="rounded-full bg-white/20 px-2 py-0.5">
          {days > 0 ? `${days} giorni` : `${hours} ore`}
        </span>
      </span>
    </Link>
  );
}
