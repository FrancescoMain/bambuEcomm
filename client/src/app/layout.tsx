"use client";

import { Plus_Jakarta_Sans, Noto_Sans } from "next/font/google"; // Import new fonts
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer"; // Import Footer
import ClientProvider from "@/components/layout/ClientProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  title: "Cartolibreria Bambù",
  description: "Cartolibreria Bambù - Libri, cancelleria, regali e molto altro!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClientProvider>
      <html
        lang="it"
        className={`${plusJakartaSans.variable} ${notoSans.variable}`}
      >
        <head>
          <link rel="icon" href="/bambu-logo.jpg" type="image/jpeg" />
          {/* Redundant font link (next/font is used) - commented out */}
          {/* <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&family=Noto+Sans:wght@400;700&display=swap"
          /> */}
          {/* Redundant Tailwind CDN (PostCSS setup is expected) - commented out */}
          <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        </head>
        <body className={`font-sans antialiased`}>
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
        </body>
      </html>
    </ClientProvider>
  );
}
