"use client";

import { useEffect, useState } from "react";

interface IubendaAPI {
  openPreferenceCenter?: () => void;
}

interface IubendaCS {
  api?: IubendaAPI;
}

interface IubendaObject {
  cs?: IubendaCS;
  csConfiguration?: any;
}

export const useIubenda = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkIubenda = () => {
      if (typeof window !== "undefined") {
        const iub = (window as any)._iub;
        if (iub && iub.cs && iub.cs.api) {
          setIsLoaded(true);
          setError(null);
        } else {
          // Try again in 100ms
          setTimeout(checkIubenda, 100);
        }
      }
    };

    // Start checking after a small delay to allow scripts to load
    const timer = setTimeout(checkIubenda, 500);

    // Cleanup timer on unmount
    return () => clearTimeout(timer);
  }, []);

  const openPreferenceCenter = () => {
    if (typeof window !== "undefined") {
      const iub = (window as any)._iub;

      try {
        // Primary method: Use iubenda API
        if (
          iub &&
          iub.cs &&
          iub.cs.api &&
          typeof iub.cs.api.openPreferenceCenter === "function"
        ) {
          iub.cs.api.openPreferenceCenter();
          return true;
        }

        // Fallback 1: Find and click preference button
        const iubendaButton = document.querySelector(
          "[data-iub-cs-preferences]"
        );
        if (iubendaButton) {
          (iubendaButton as HTMLElement).click();
          return true;
        }

        // Fallback 2: Find cookie notice and click preferences
        const cookieNotice = document.querySelector("#iubenda-cs-banner");
        if (cookieNotice) {
          const preferencesLink = cookieNotice.querySelector(
            'a[href*="preferences"], button[data-iub-cs-preferences]'
          );
          if (preferencesLink) {
            (preferencesLink as HTMLElement).click();
            return true;
          }
        }

        // Fallback 3: Try to trigger via event
        const event = new CustomEvent("iubenda-preference-center-open");
        window.dispatchEvent(event);

        return false;
      } catch (error) {
        console.error("Error opening iubenda preference center:", error);
        setError("Errore durante l'apertura delle preferenze dei cookie");
        return false;
      }
    }

    return false;
  };

  return {
    isLoaded,
    error,
    openPreferenceCenter,
  };
};
