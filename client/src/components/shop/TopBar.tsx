"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "./icons";
import { withThreshold } from "@/lib/format";

/** Barra messaggi in alto: i testi si modificano da Pannello → Impostazioni */
export function TopBar({ settings }: { settings: StoreSettings }) {
  const messages = settings.topBar.attivo ? settings.topBar.messaggi : [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), 4500);
    return () => clearInterval(id);
  }, [messages.length]);

  if (!messages.length) return null;
  const { social, contatti } = settings;

  return (
    <div className="bg-ink text-[13px] text-white">
      <div className="container flex h-9 items-center justify-between gap-4">
        <div className="hidden items-center gap-3 sm:flex">
          {social.instagram && (
            <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="opacity-80 hover:opacity-100">
              <InstagramIcon className="h-3.5 w-3.5" />
            </a>
          )}
          {social.tiktok && (
            <a href={social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="opacity-80 hover:opacity-100">
              <TikTokIcon className="h-3.5 w-3.5" />
            </a>
          )}
          {social.facebook && (
            <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="opacity-80 hover:opacity-100">
              <FacebookIcon className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        <p key={index} className="flex-1 animate-fade-in truncate text-center font-semibold tracking-wide">
          {withThreshold(messages[index], settings.spedizione.sogliaGratuita)}
        </p>
        <a
          href={`tel:${contatti.telefono.replace(/\s/g, "")}`}
          className="hidden items-center gap-1.5 opacity-80 hover:opacity-100 sm:flex"
        >
          <Phone className="h-3.5 w-3.5" />
          {contatti.telefono}
        </a>
      </div>
    </div>
  );
}
