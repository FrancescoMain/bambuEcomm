import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ClientInit } from "@/components/shop/ClientInit";
import { Analytics } from "@/components/shop/Analytics";
import { SITE_NAME, SITE_URL } from "@/lib/urls";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Cartoleria Bambù | Cancelleria e articoli per la scuola a Torre Annunziata",
    template: "%s | Cartoleria Bambù",
  },
  description:
    "Cartoleria Bambù a Torre Annunziata dal 2016: quaderni, zaini, penne, cancelleria per scuola e ufficio, giochi e idee regalo. Spedizione in tutta Italia o ritiro gratuito in negozio.",
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: SITE_NAME,
    images: [{ url: "/bambu-logo.jpg", width: 629, height: 354, alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image" },
  icons: { apple: "/logo-panda-512.png" },
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large", "max-snippet": -1 } },
};

export const viewport: Viewport = {
  themeColor: "#2f7a36",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={sans.variable} data-scroll-behavior="smooth">
      <head>
        {/* Le immagini dei prodotti arrivano da Cloudinary: apriamo subito la connessione */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="min-h-screen font-sans">
        {children}
        <ClientInit />
        <Toaster position="top-center" richColors closeButton toastOptions={{ className: "font-sans" }} />
        <Analytics />
      </body>
    </html>
  );
}
