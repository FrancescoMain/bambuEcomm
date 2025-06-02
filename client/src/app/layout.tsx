import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans } from "next/font/google"; // Import new fonts
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer"; // Import Footer

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

export const metadata: Metadata = {
  title: "Bambu E-commerce",
  description: "Il tuo negozio online di fiducia.",
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
        {/* Questo link aggiunge i font Plus Jakarta Sans e Noto Sans. */}
        {/* Nota: questi font sono già gestiti da next/font in questo progetto, */}
        {/* quindi questa riga potrebbe essere ridondante. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&family=Noto+Sans:wght@400;700&display=swap"
        />
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
      </head>
      <body className={`font-sans antialiased`}>
        <div className="relative flex flex-col w-full min-h-screen bg-[#f8fbfa] group/design-root overflow-x-hidden">
          <div className="layout-container flex h-full grow flex-col">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8 pt-24">
              {/* Added pt-24 for fixed header spacing */}
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
