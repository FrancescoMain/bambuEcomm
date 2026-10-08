import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-6680SVPRN1";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Script di terze parti. Iubenda gestisce il consenso cookie: gli script di
 * statistica e marketing sono "text/plain" con data-iub-purposes e vengono
 * attivati da iubenda solo dopo il consenso (4 = misurazione, 5 = marketing).
 */
export function Analytics() {
  return (
    <>
      <Script id="iubenda-config" strategy="afterInteractive">
        {`var _iub = _iub || []; _iub.csConfiguration = {"siteId":4165293,"cookiePolicyId":33504144,"lang":"it","storage":{"useSiteId":true}};`}
      </Script>
      <Script id="iubenda-autoblocking" src="https://cs.iubenda.com/autoblocking/4165293.js" strategy="afterInteractive" />
      <Script id="iubenda-gpp-stub" src="https://cdn.iubenda.com/cs/gpp/stub.js" strategy="afterInteractive" />
      <Script id="iubenda-cs" src="https://cdn.iubenda.com/cs/iubenda_cs.js" strategy="afterInteractive" />

      <Script
        id="gtag-base"
        strategy="afterInteractive"
        type="text/plain"
        data-iub-purposes="4"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="gtag-config" strategy="afterInteractive" type="text/plain" data-iub-purposes="4">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>

      {META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive" type="text/plain" data-iub-purposes="5">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
