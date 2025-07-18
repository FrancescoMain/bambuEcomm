"use client";

import { useEffect } from "react";
import Script from "next/script";

export default function IubendaScripts() {
  useEffect(() => {
    // Initialize iubenda configuration
    if (typeof window !== "undefined") {
      (window as any)._iub = (window as any)._iub || [];
      (window as any)._iub.csConfiguration = {
        siteId: 4165293,
        cookiePolicyId: 33504144,
        lang: "it",
        storage: {
          useSiteId: true,
        },
      };
    }
  }, []);

  return (
    <>
      <Script
        id="iubenda-autoblocking"
        src="https://cs.iubenda.com/autoblocking/4165293.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("iubenda autoblocking script loaded");
        }}
        onError={(e) => {
          console.error("Failed to load iubenda autoblocking script:", e);
        }}
      />
      <Script
        id="iubenda-gpp-stub"
        src="//cdn.iubenda.com/cs/gpp/stub.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("iubenda gpp stub script loaded");
        }}
        onError={(e) => {
          console.error("Failed to load iubenda gpp stub script:", e);
        }}
      />
      <Script
        id="iubenda-cs"
        src="//cdn.iubenda.com/cs/iubenda_cs.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("iubenda cs script loaded");
        }}
        onError={(e) => {
          console.error("Failed to load iubenda cs script:", e);
        }}
      />
    </>
  );
}
