import { Plus_Jakarta_Sans, Noto_Sans } from "next/font/google"; // Import new fonts
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer"; // Import Footer
import ClientProvider from "@/components/layout/ClientProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css"; // Import global styles
import { LoadingProvider } from "@/components/layout/LoadingContext";
import GlobalLoader from "@/components/layout/GlobalLoader";
import { CartProvider } from "@/components/layout/CartProvider"; // Import CartProvider
import { NotificationProvider } from "@/components/ui/NotificationProvider";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

// Configure Plus Jakarta Sans
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans", // CSS variable for Plus Jakarta Sans
});

// Configure Noto Sans
const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "700"], // Specify weights if needed, or remove for all
  display: "swap",
  variable: "--font-noto-sans", // CSS variable for Noto Sans
});

export const metadata = {
  metadataBase: new URL("https://www.xn--cartoleriabamb-jrb.com"),
  title:
    "Cartoleria Bambù | Cancelleria Torre Annunziata | Quaderni Penne Online",
  description:
    "Cartoleria Bambù a Torre Annunziata dal 2016. Quaderni, penne, cancelleria online. Consegna rapida in Campania. ⭐ La tua cartoleria di fiducia.",
  keywords:
    "cartoleria Torre Annunziata, cancelleria online, quaderni, penne, materiale scolastico, cartoleria bambù",
  authors: [{ name: "Cartoleria Bambù" }],
  openGraph: {
    title: "Cartoleria Bambù | La tua cartoleria di fiducia a Torre Annunziata",
    description:
      "Dal 2016 la migliore cartoleria di Torre Annunziata. Ora anche online! Quaderni, penne, cancelleria per scuola e ufficio.",
    url: "https://www.xn--cartoleriabamb-jrb.com/",
    siteName: "Cartoleria Bambù",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "/bambu-logo.jpg",
        width: 1200,
        height: 630,
        alt: "Cartoleria Bambù - Torre Annunziata",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cartoleria Bambù | Torre Annunziata",
    description:
      "La tua cartoleria di fiducia dal 2016. Quaderni, penne e cancelleria online.",
    images: ["/bambu-logo.jpg"],
  },
  alternates: {
    canonical: "https://www.xn--cartoleriabamb-jrb.com/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${plusJakartaSans.variable} ${notoSans.variable}`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/bambu-logo.jpg" type="image/jpeg" />
        <link rel="shortcut icon" href="/bambu-logo.jpg" type="image/jpeg" />
        {/* Redundant font link (next/font is used) - commented out */}
        {/* <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&family=Noto+Sans:wght@400;700&display=swap"
        /> */}
        {/* Redundant Tailwind CDN (PostCSS setup is expected) - commented out */}
      </head>
      <body className={`font-sans antialiased`}>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics
            GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
          />
        )}{" "}
        <ClientProvider>
          <NotificationProvider>
            <CartProvider>
              <LoadingProvider>
                <GlobalLoader />
                <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="colored"
                  aria-label="Notification container" // Added aria-label
                />
                <div className="relative flex flex-col w-full min-h-screen bg-[#f8fbfa]  group/design-root overflow-x-hidden">
                  <div className="layout-container flex h-full grow flex-col">
                    <Header />

                    <main className="flex-grow container mx-auto px-4 ">
                      {/* Added pt-24 for fixed header spacing */}
                      {children}
                    </main>
                    <Footer />
                  </div>
                </div>
              </LoadingProvider>
            </CartProvider>
          </NotificationProvider>
        </ClientProvider>
      </body>
    </html>
  );
}
