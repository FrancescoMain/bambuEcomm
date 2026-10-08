"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type ConfirmFn = (opts: {
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}) => Promise<boolean>;

const QUESTION = {
  title: "Uscire senza salvare?",
  message: "Hai fatto delle modifiche che non sono ancora state salvate. Se esci adesso andranno perse.",
  confirmLabel: "Esci senza salvare",
  danger: true,
};

/**
 * Avvisa prima di lasciare la pagina con modifiche non salvate:
 * chiusura/ricarica della scheda (avviso del browser) e clic sui link interni
 * (finestra di conferma del pannello).
 */
export function useUnsavedChanges(active: boolean, confirm: ConfirmFn) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      void confirm(QUESTION).then((leave) => {
        if (leave) router.push(`${url.pathname}${url.search}${url.hash}`);
      });
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [active, confirm, router]);

  /** Per i pulsanti "Annulla"/"Indietro": chiede conferma solo se serve */
  return async (href: string) => {
    if (active && !(await confirm(QUESTION))) return;
    router.push(href);
  };
}
