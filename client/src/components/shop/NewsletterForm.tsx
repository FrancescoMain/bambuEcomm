"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { api, errorMessage } from "@/lib/api/client";
import { Honeypot } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

export function NewsletterForm({ dark, onDone }: { dark?: boolean; onDone?: () => void }) {
  const [email, setEmail] = useState("");
  const [consenso, setConsenso] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!consenso) {
      toast.error("Per iscriverti accetta l'informativa privacy.");
      return;
    }
    setLoading(true);
    try {
      const website = (new FormData(e.currentTarget).get("website") as string) || undefined;
      const res = await api<{ message: string }>("/newsletter/subscribe", {
        method: "POST",
        auth: false,
        body: { email, consenso, website },
      });
      toast.success(res.message);
      setEmail("");
      onDone?.();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="relative w-full">
      <Honeypot />
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="La tua email"
          aria-label="La tua email"
          className={cn(
            "h-12 min-w-0 flex-1 rounded-full px-5 text-[15px] focus:outline-none focus:ring-4",
            dark
              ? "border border-white/20 bg-white/10 text-white placeholder:text-white/60 focus:ring-white/20"
              : "border border-paper-line bg-white text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-brand-500/15"
          )}
        />
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-bold transition disabled:opacity-60",
            dark ? "bg-white text-ink hover:bg-brand-50" : "bg-brand-600 text-white hover:bg-brand-700"
          )}
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Iscriviti</span>
        </button>
      </div>
      <label className={cn("mt-3 flex items-start gap-2 text-xs", dark ? "text-white/75" : "text-ink-muted")}>
        <input
          type="checkbox"
          checked={consenso}
          onChange={(e) => setConsenso(e.target.checked)}
          className="form-checkbox mt-0.5 h-4 w-4 rounded border-paper-line text-brand-600"
        />
        <span>
          Acconsento a ricevere la newsletter e ho letto l&apos;{" "}
          <Link href="/privacy" className="underline">
            informativa privacy
          </Link>
          .
        </span>
      </label>
    </form>
  );
}
