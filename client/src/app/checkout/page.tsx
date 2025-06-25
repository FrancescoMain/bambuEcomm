"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import type { User } from "@/redux/authSlice";
import { useNotifications } from "@/components/ui/NotificationProvider";

// Dati utente e spedizione
interface CheckoutForm {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  via: string;
  numero: string;
  citta: string;
  cap: string;
  stato: string;
  note: string;
  saveInfo: boolean;
  newsletter: boolean;
  fattura: boolean;
}

const initialForm: CheckoutForm = {
  nome: "",
  cognome: "",
  email: "",
  telefono: "",
  via: "",
  numero: "",
  citta: "",
  cap: "",
  stato: "Italia",
  note: "",
  saveInfo: false,
  newsletter: false,
  fattura: false,
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://bambu-ecomm-in2g.vercel.app/api";

export default function CheckoutPage() {
  const router = useRouter();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const currentUser = useSelector(
    (state: RootState) => state.auth.user
  ) as User | null;
  const { showToast } = useNotifications();
  const [form, setForm] = useState<CheckoutForm>(
    currentUser
      ? {
          ...initialForm,
          email: currentUser.email,
          nome: currentUser.name?.split(" ")[0] || "",
          cognome: currentUser.name?.split(" ").slice(1).join(" ") || "",
        }
      : initialForm
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  // Redirect se carrello vuoto
  React.useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      console.log("🛒 Checkout: Carrello vuoto, redirect alla home");
      router.push("/");
    }
  }, [cartItems, router]);

  // Calcoli carrello
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.prezzo * item.quantity,
    0
  );
  const shippingThreshold = 50;
  const shippingCost = subtotal >= shippingThreshold ? 0 : 4.99;
  const total = subtotal + shippingCost;

  // Handler form
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const validateForm = () => {
    const scrollToError = (message: string) => {
      showToast(message, "warning");
      // Scroll to top of form on validation error
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    };

    if (!form.email?.trim()) {
      return scrollToError("Per favore inserisci la tua email");
    }
    if (!form.email.includes("@")) {
      return scrollToError("Per favore inserisci un indirizzo email valido");
    }
    if (!form.nome?.trim()) {
      return scrollToError("Per favore inserisci il nome");
    }
    if (!form.cognome?.trim()) {
      return scrollToError("Per favore inserisci il cognome");
    }
    if (!form.telefono?.trim()) {
      return scrollToError("Per favore inserisci il numero di telefono");
    }
    if (!form.via?.trim()) {
      return scrollToError("Per favore inserisci l'indirizzo");
    }
    if (!form.numero?.trim()) {
      return scrollToError("Per favore inserisci il numero civico");
    }
    if (!form.citta?.trim()) {
      return scrollToError("Per favore inserisci la città");
    }
    if (!form.cap?.trim()) {
      return scrollToError("Per favore inserisci il CAP");
    }
    if (!/^\d{5}$/.test(form.cap)) {
      return scrollToError("Il CAP deve essere di 5 cifre");
    }
    if (!form.stato?.trim()) {
      return scrollToError("Per favore seleziona lo stato");
    }
    return true;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, cart: cartItems }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect a Stripe
      } else {
        showToast(
          "Errore durante la creazione della sessione di pagamento.",
          "error"
        );
        setError("Errore durante la creazione della sessione di pagamento.");
      }
    } catch (err) {
      showToast("Errore di rete.", "error");
      setError("Errore di rete.");
    }
    setSubmitting(false);
  };

  // Aggiorna nome/cognome se cambia utente loggato
  React.useEffect(() => {
    if (currentUser) {
      setForm((prev) => ({
        ...prev,
        email: currentUser.email,
        nome: currentUser.name?.split(" ")[0] || "",
        cognome: currentUser.name?.split(" ").slice(1).join(" ") || "",
      }));
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#51946b] to-[#3d7a57] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-6">
            <button
              onClick={() => router.push("/")}
              className="text-green-100 hover:text-white transition-colors"
            >
              Home
            </button>
            <span className="text-green-200">/</span>
            <button
              onClick={() => router.push("/cart")}
              className="text-green-100 hover:text-white transition-colors"
            >
              Carrello
            </button>
            <span className="text-green-200">/</span>
            <span className="text-white font-medium">Checkout</span>
          </nav>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                🔒 Checkout Sicuro
              </h1>
              <p className="text-green-100 text-lg">
                Completa il tuo ordine in modo sicuro e veloce
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="hidden md:flex items-center gap-4 max-w-md">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white text-[#51946b] rounded-full flex items-center justify-center font-bold">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium">Carrello</span>
            </div>
            <div className="flex-1 h-1 bg-white/30 rounded">
              <div className="h-full bg-white rounded w-full"></div>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white text-[#51946b] rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <span className="ml-2 text-sm font-medium">Dati</span>
            </div>
            <div className="flex-1 h-1 bg-white/30 rounded">
              <div className="h-full bg-white/30 rounded"></div>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white/30 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <span className="ml-2 text-sm font-medium opacity-70">
                Pagamento
              </span>
            </div>
          </div>

          {/* Mobile: Simple indicator */}
          <div className="md:hidden flex items-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <div className="w-3 h-3 bg-white/30 rounded-full"></div>
            <span className="ml-3 text-sm font-medium">Passo 2 di 3</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section (2/3 width on desktop) */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="space-y-8"
              id="checkout-form"
            >
              {/* Contact Information */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#51946b] to-[#3d7a57] rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Informazioni di Contatto
                    </h2>
                    <p className="text-gray-600">
                      Inserisci i tuoi dati per la consegna
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      name="email"
                      type="email"
                      placeholder="email@esempio.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#51946b] focus:border-[#51946b] transition-colors"
                      value={form.email}
                      onChange={handleChange}
                      required
                      readOnly={!!currentUser}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Telefono *
                    </label>
                    <input
                      name="telefono"
                      type="tel"
                      placeholder="+39 123 456 7890"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#51946b] focus:border-[#51946b] transition-colors"
                      value={form.telefono}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#51946b] to-[#3d7a57] rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Indirizzo di Spedizione
                    </h2>
                    <p className="text-gray-600">
                      Dove vuoi ricevere il tuo ordine
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nome *
                      </label>
                      <input
                        name="nome"
                        placeholder="Mario"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#51946b] focus:border-[#51946b] transition-colors"
                        value={form.nome}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cognome *
                      </label>
                      <input
                        name="cognome"
                        placeholder="Rossi"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#51946b] focus:border-[#51946b] transition-colors"
                        value={form.cognome}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Indirizzo *
                      </label>
                      <input
                        name="via"
                        placeholder="Via Roma"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#51946b] focus:border-[#51946b] transition-colors"
                        value={form.via}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        N. *
                      </label>
                      <input
                        name="numero"
                        placeholder="123"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#51946b] focus:border-[#51946b] transition-colors"
                        value={form.numero}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Città *
                      </label>
                      <input
                        name="citta"
                        placeholder="Milano"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#51946b] focus:border-[#51946b] transition-colors"
                        value={form.citta}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CAP *
                      </label>
                      <input
                        name="cap"
                        placeholder="20121"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#51946b] focus:border-[#51946b] transition-colors"
                        value={form.cap}
                        onChange={handleChange}
                        pattern="[0-9]{5}"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Stato *
                      </label>
                      <select
                        name="stato"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#51946b] focus:border-[#51946b] transition-colors"
                        value={form.stato}
                        onChange={handleChange}
                        required
                      >
                        <option value="Italia">Italia</option>
                        <option value="San Marino">San Marino</option>
                        <option value="Vaticano">Vaticano</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Note per la consegna (opzionale)
                    </label>
                    <textarea
                      name="note"
                      placeholder="Es. Suonare al citofono, lasciare alla portineria..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#51946b] focus:border-[#51946b] transition-colors min-h-[80px] resize-y"
                      value={form.note}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Opzioni Aggiuntive
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="saveInfo"
                      checked={form.saveInfo}
                      onChange={handleChange}
                      className="w-5 h-5 text-[#51946b] border-gray-300 rounded focus:ring-[#51946b]"
                    />
                    <span className="text-gray-700">
                      Salva le mie informazioni per i prossimi acquisti
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="newsletter"
                      checked={form.newsletter}
                      onChange={handleChange}
                      className="w-5 h-5 text-[#51946b] border-gray-300 rounded focus:ring-[#51946b]"
                    />
                    <span className="text-gray-700">
                      Ricevi la nostra newsletter con offerte esclusive
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="fattura"
                      checked={form.fattura}
                      onChange={handleChange}
                      className="w-5 h-5 text-[#51946b] border-gray-300 rounded focus:ring-[#51946b]"
                    />
                    <span className="text-gray-700">
                      Richiedi fattura aziendale
                    </span>
                  </label>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-red-700 font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons - Mobile */}
              <div className="lg:hidden space-y-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#51946b] text-white py-4 rounded-xl font-semibold hover:bg-[#3d7a57] transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Elaborazione...
                    </div>
                  ) : (
                    `Procedi al Pagamento • €${total.toFixed(2)}`
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/cart")}
                  disabled={submitting}
                  className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  ← Torna al Carrello
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary Sidebar (1/3 width on desktop) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Mobile Summary Toggle */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setShowOrderSummary(!showOrderSummary)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      Riepilogo Ordine
                    </span>
                    <span className="text-sm text-gray-500">
                      ({cartItems.length}{" "}
                      {cartItems.length === 1 ? "prodotto" : "prodotti"})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#51946b]">
                      €{total.toFixed(2)}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        showOrderSummary ? "rotate-180" : ""
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Order Summary Content */}
              <div
                className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 ${
                  !showOrderSummary ? "hidden lg:block" : ""
                }`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#51946b] to-[#3d7a57] rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Il tuo Ordine
                    </h3>
                    <p className="text-gray-600">
                      {cartItems.length}{" "}
                      {cartItems.length === 1 ? "prodotto" : "prodotti"}
                    </p>
                  </div>
                </div>

                {/* Product List */}
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex gap-4 p-3 bg-gray-50 rounded-xl"
                    >
                      <img
                        src={item.immagine || "/file.svg"}
                        alt={item.titolo}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                          {item.titolo}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Qtà: {item.quantity}
                          </span>
                          <span className="font-bold text-[#51946b]">
                            €{(item.prezzo * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Free Shipping Progress */}
                {subtotal < shippingThreshold && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707L15 6.586A1 1 0 0014.707 6.293L11.414 3H10a1 1 0 00-1 1v3a1 1 0 001 1h4z" />
                      </svg>
                      <span className="text-sm font-semibold text-green-800">
                        Aggiungi €{(shippingThreshold - subtotal).toFixed(2)}{" "}
                        per la spedizione gratuita!
                      </span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(subtotal / shippingThreshold) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Pricing Breakdown */}
                <div className="space-y-3 pb-4 border-b border-gray-200">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotale</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Spedizione</span>
                    <span>
                      {shippingCost === 0 ? (
                        <span className="text-green-600 font-semibold">
                          Gratuita
                        </span>
                      ) : (
                        `€${shippingCost.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {form.fattura && (
                    <div className="flex justify-between text-gray-700">
                      <span>IVA (22%)</span>
                      <span>€{(subtotal * 0.22).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center text-xl font-bold text-gray-900 pt-4 mb-6">
                  <span>Totale</span>
                  <span className="text-[#51946b]">€{total.toFixed(2)}</span>
                </div>

                {/* Trust Signals */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Pagamento sicuro SSL 256-bit</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Garanzia di rimborso 30 giorni</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <svg
                      className="w-5 h-5 text-purple-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Assistenza clienti 24/7</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Metodi di pagamento accettati:
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg">
                      <span className="text-xs font-semibold text-gray-700">
                        VISA
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg">
                      <span className="text-xs font-semibold text-gray-700">
                        MASTERCARD
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg">
                      <span className="text-xs font-semibold text-gray-700">
                        PAYPAL
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg">
                      <span className="text-xs font-semibold text-gray-700">
                        STRIPE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop Action Buttons */}
                <div className="hidden lg:block space-y-3">
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={submitting}
                    className="w-full bg-[#51946b] text-white py-4 rounded-xl font-semibold hover:bg-[#3d7a57] transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Elaborazione...
                      </div>
                    ) : (
                      `🔒 Procedi al Pagamento Sicuro`
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/cart")}
                    disabled={submitting}
                    className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    ← Torna al Carrello
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-600">Totale ordine</p>
            <p className="text-xl font-bold text-[#51946b]">
              €{total.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {cartItems.length}{" "}
              {cartItems.length === 1 ? "prodotto" : "prodotti"}
            </p>
            <p className="text-xs text-green-600 font-medium">
              {shippingCost === 0
                ? "Spedizione gratuita"
                : `+ €${shippingCost.toFixed(2)} spedizione`}
            </p>
          </div>
        </div>
        <button
          type="submit"
          form="checkout-form"
          disabled={submitting}
          className="w-full bg-[#51946b] text-white py-4 rounded-xl font-semibold hover:bg-[#3d7a57] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Elaborazione...
            </div>
          ) : (
            "🔒 Procedi al Pagamento Sicuro"
          )}
        </button>
      </div>

      {/* Mobile Spacer */}
      <div className="lg:hidden h-32"></div>
    </div>
  );
}
