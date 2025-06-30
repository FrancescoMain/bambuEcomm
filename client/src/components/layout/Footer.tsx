"use client";

import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-[#51946b] to-[#3d7a57] text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🌿</span>
              <h3 className="text-2xl font-bold">BAMBÙ</h3>
            </div>
            <p className="text-green-100 mb-6 leading-relaxed">
              La tua libreria online di fiducia. Scopri un mondo di cultura,
              creatività e apprendimento.
            </p>
            <div className="space-y-2 text-sm text-green-100">
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>Corso Umberto I, 367 - 80058 Torre Annunziata (NA)</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📞</span>
                <span>081 1858 5191</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="text-lg font-bold mb-4">Link Rapidi</h4>
            <div className="space-y-3">
              <Link
                href="/chi-siamo"
                className="block text-green-100 hover:text-white transition-colors"
              >
                Chi Siamo
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="col-span-1">
            <h4 className="text-lg font-bold mb-4">Categorie</h4>
            <div className="space-y-3">
              <Link
                href="/search?category=Libri"
                className="block text-green-100 hover:text-white transition-colors"
              >
                Libri
              </Link>
              <Link
                href="/search?category=Cancelleria"
                className="block text-green-100 hover:text-white transition-colors"
              >
                Cancelleria
              </Link>
              <Link
                href="/search?category=Zaini"
                className="block text-green-100 hover:text-white transition-colors"
              >
                Zaini e Borse
              </Link>
            </div>
          </div>

          {/* Account */}
          <div className="col-span-1">
            <h4 className="text-lg font-bold mb-4">Il tuo Account</h4>
            <div className="space-y-3">
              <Link
                href="/orders"
                className="block text-green-100 hover:text-white transition-colors"
              >
                I miei ordini
              </Link>
              <Link
                href="/login"
                className="block text-green-100 hover:text-white transition-colors"
              >
                Accedi
              </Link>
              <Link
                href="/register"
                className="block text-green-100 hover:text-white transition-colors"
              >
                Registrati
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-8 mb-12">
          {/* Logo & Description */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl">🌿</span>
              <h3 className="text-2xl font-bold">BAMBÙ</h3>
            </div>
            <p className="text-green-100 mb-4">
              La tua libreria online di fiducia
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-center">Link Rapidi</h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <Link
                href="/chi-siamo"
                className="text-green-100 hover:text-white transition-colors"
              >
                Chi Siamo
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-center">Categorie</h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <Link
                href="/search?category=Libri"
                className="text-green-100 hover:text-white transition-colors"
              >
                Libri
              </Link>
              <Link
                href="/search?category=Cancelleria"
                className="text-green-100 hover:text-white transition-colors"
              >
                Cancelleria
              </Link>

              <Link
                href="/search?category=Zaini"
                className="text-green-100 hover:text-white transition-colors"
              >
                Zaini e Borse
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">
                <span className="text-xl">🔒</span>
              </div>
              <h5 className="font-bold text-sm">Pagamenti SSL</h5>
              <p className="text-xs text-green-100">256-bit</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">
                <span className="text-xl">💳</span>
              </div>
              <h5 className="font-bold text-sm">Carte Accettate</h5>
              <div className="flex gap-1 mt-1">
                <span className="text-xs bg-white/20 px-1 rounded">VISA</span>
                <span className="text-xs bg-white/20 px-1 rounded">MC</span>
                <span className="text-xs bg-white/20 px-1 rounded">PP</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">
                <span className="text-xl">📞</span>
              </div>
              <h5 className="font-bold text-sm">Assistenza</h5>
              <p className="text-xs text-green-100">Whatsapp</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">
                <span className="text-xl">🚚</span>
              </div>
              <h5 className="font-bold text-sm">Spedizione</h5>
              <p className="text-xs text-green-100">Gratuita da €50</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-green-100">
                © 2025 Cartoleria Bambù | P.IVA 10611291211
              </p>
              <p className="text-green-200 text-sm">
                Corso Umberto I, 367 - 80058 Torre Annunziata (NA), Italia
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/privacy"
                className="text-green-100 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-green-100 hover:text-white transition-colors"
              >
                Termini di Servizio
              </Link>
              <Link
                href="/cookies"
                className="text-green-100 hover:text-white transition-colors"
              >
                Cookie Policy
              </Link>
              <button className="text-green-100 hover:text-white transition-colors">
                Gestione Cookie
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
