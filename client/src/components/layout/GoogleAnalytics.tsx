"use client";

import Script from "next/script";

export default function GoogleAnalytics() {
  return (
    <>
      <Script
        id="gtag-base"
        strategy="afterInteractive"
        type="text/plain"
        data-iub-purposes="4"
        src="https://www.googletagmanager.com/gtag/js?id=G-6680SVPRN1"
      />
      <Script
        id="gtag-config"
        strategy="afterInteractive"
        type="text/plain"
        data-iub-purposes="4"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-6680SVPRN1');
          `,
        }}
      />
    </>
  );
}
