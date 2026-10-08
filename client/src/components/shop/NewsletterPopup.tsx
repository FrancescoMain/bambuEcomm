"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Drawer";
import { NewsletterForm } from "./NewsletterForm";

const KEY = "bambu-newsletter-popup";

/** Popup newsletter mostrato una sola volta (attivabile dal pannello) */
export function NewsletterPopup({ titolo, testo, ritardo }: { titolo: string; testo: string; ritardo: number }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setOpen(true), Math.max(3, ritardo) * 1000);
    return () => clearTimeout(t);
  }, [ritardo]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      // ignora
    }
  };

  return (
    <Modal open={open} onClose={close}>
      <div className="bg-confetti -m-6 mb-0 rounded-t-3xl p-6 pb-2 sm:rounded-t-3xl">
        <p className="text-3xl">✏️</p>
        <h2 className="mt-2 text-2xl font-extrabold">{titolo}</h2>
        <p className="mt-1 text-ink-muted">{testo}</p>
      </div>
      <div className="mt-6">
        <NewsletterForm onDone={close} />
      </div>
    </Modal>
  );
}
