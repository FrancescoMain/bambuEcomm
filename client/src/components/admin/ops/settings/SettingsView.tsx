"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleHelp, CreditCard, Gift, LayoutTemplate, Mail, RotateCcw, Store, Truck } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { api } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/Spinner";
import { PageTitle } from "@/components/admin/PageTitle";
import { cn } from "@/lib/cn";
import { Callout } from "../Callout";
import { useAsync } from "../useAsync";
import { useQueryParams } from "../useQueryParams";
import { FaqSection } from "./sections/FaqSection";
import { GiftSection } from "./sections/GiftSection";
import { HomeSection } from "./sections/HomeSection";
import { PaymentsSection } from "./sections/PaymentsSection";
import { PopupSection } from "./sections/PopupSection";
import { ReturnsSection } from "./sections/ReturnsSection";
import { ShippingSection } from "./sections/ShippingSection";
import { StoreSection } from "./sections/StoreSection";
import { DirtyContext, SavedSettingsContext } from "./useSettingsForm";

const SECTIONS = [
  { key: "spedizioni", label: "Spedizioni e ritiro", icon: Truck, Component: ShippingSection },
  { key: "pagamenti", label: "Pagamenti", icon: CreditCard, Component: PaymentsSection },
  { key: "omaggio", label: "Omaggio", icon: Gift, Component: GiftSection },
  { key: "home", label: "Home page", icon: LayoutTemplate, Component: HomeSection },
  { key: "faq", label: "Domande frequenti", icon: CircleHelp, Component: FaqSection },
  { key: "resi", label: "Resi e recesso", icon: RotateCcw, Component: ReturnsSection },
  { key: "popup", label: "Popup newsletter", icon: Mail, Component: PopupSection },
  { key: "negozio", label: "Negozio e contatti", icon: Store, Component: StoreSection },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export function SettingsView() {
  const [params, setParams] = useQueryParams();
  const sectionParam = params.get("sezione");
  const active: SectionKey = SECTIONS.some((s) => s.key === sectionParam) ? (sectionParam as SectionKey) : "spedizioni";

  const loaded = useAsync(() => api<StoreSettings>("/settings"), []);
  const [latest, setLatest] = useState<StoreSettings | null>(null);
  useEffect(() => {
    if (loaded.data) setLatest(loaded.data);
  }, [loaded.data]);

  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const reportDirty = useCallback(
    (section: string, value: boolean) => setDirty((prev) => (!!prev[section] === value ? prev : { ...prev, [section]: value })),
    []
  );
  const anyDirty = Object.values(dirty).some(Boolean);

  // Avvisa prima di lasciare la pagina con modifiche non salvate
  useEffect(() => {
    if (!anyDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [anyDirty]);

  const shared = useMemo(() => (latest ? { settings: latest, onSaved: setLatest } : null), [latest]);

  const go = (key: SectionKey) => {
    setParams({ sezione: key === "spedizioni" ? null : key });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <PageTitle
        title="Impostazioni negozio"
        description="Spedizioni, pagamenti, home page, contatti: tutto ciò che vedono i clienti, modificabile senza toccare il codice."
      />

      {loaded.error && !latest ? (
        <Callout tone="danger" title="Impossibile caricare le impostazioni">
          {loaded.error}{" "}
          <button type="button" onClick={loaded.reload} className="font-semibold underline">
            Riprova
          </button>
        </Callout>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <nav aria-label="Sezioni delle impostazioni" className="lg:sticky lg:top-6 lg:self-start">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0 lg:flex-col lg:gap-0.5">
              {SECTIONS.map(({ key, label, icon: Icon }) => {
                const current = key === active;
                return (
                  <li key={key} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => go(key)}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex w-full items-center gap-2.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition lg:rounded-xl lg:border-0 lg:px-3 lg:py-2.5",
                        current
                          ? "border-ink bg-ink text-white lg:bg-white lg:text-ink lg:shadow-card"
                          : "border-paper-line bg-white text-ink-soft hover:text-ink lg:bg-transparent lg:hover:bg-white/70"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", current ? "lg:text-brand-600" : "text-current lg:text-ink-muted")} />
                      <span className="flex-1 text-left">{label}</span>
                      {dirty[key] && (
                        <>
                          <span className="h-2 w-2 shrink-0 rounded-full bg-orange" title="Modifiche non salvate" aria-hidden />
                          <span className="sr-only">(modifiche non salvate)</span>
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0">
            {!shared ? (
              <div className="space-y-5" aria-label="Caricamento impostazioni">
                <Skeleton className="h-72 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
              </div>
            ) : (
              <SavedSettingsContext.Provider value={shared}>
                <DirtyContext.Provider value={reportDirty}>
                  {SECTIONS.map(({ key, Component }) => (
                    // Tutte le sezioni restano montate: cambiando scheda le modifiche non si perdono
                    <div key={key} hidden={key !== active}>
                      <Component />
                    </div>
                  ))}
                </DirtyContext.Provider>
              </SavedSettingsContext.Provider>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
