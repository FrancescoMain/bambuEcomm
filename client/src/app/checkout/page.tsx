"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import type { User } from "@/redux/authSlice";

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
  stato: "",
  note: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const currentUser = useSelector(
    (state: RootState) => state.auth.user
  ) as User | null;
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

  // Calcolo totale carrello
  const total = cartItems.reduce(
    (sum, item) => sum + item.prezzo * item.quantity,
    0
  );

  // Handler form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, cart: cartItems }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect a Stripe
      } else {
        setError("Errore durante la creazione della sessione di pagamento.");
      }
    } catch (err) {
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
    <div className="layout-container flex h-full grow flex-col px-2 md:px-0">
      <div className="gap-1 px-6 flex flex-1 justify-center py-5">
        <div className="layout-content-container flex flex-col max-w-[920px] flex-1">
          <div className="flex flex-wrap gap-2 p-4">
            <a
              className="text-[#648771] text-base font-medium leading-normal"
              href="/cart"
            >
              Carrello
            </a>
            <span className="text-[#648771] text-base font-medium leading-normal">
              /
            </span>
            <span className="text-[#111714] text-base font-medium leading-normal">
              Checkout
            </span>
          </div>
          <h1 className="text-[#111714] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 text-left pb-3 pt-5">
            Checkout
          </h1>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Colonna sinistra: Form */}
            <form
              className="flex-1 max-w-[480px] bg-white rounded-xl shadow p-4"
              onSubmit={handleSubmit}
            >
              <div
                className="bg-cover bg-center flex flex-col items-stretch justify-end rounded-xl pt-[60px] shadow-[0_0_4px_rgba(0,0,0,0.1)] mb-6"
                style={{
                  backgroundImage:
                    'linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAwwWUpRnaGsU741EBgiXhn-XvE2pB-ExrlRIJVbYaob98WroDQrUQa4C_xnO03ZrE4MNw3hsLqR3c5Cq-xRnzCZzZQxr0EyKyopvRS4S1OKjLNPR8g4nI2KeHdEdYKvYl9Qbc5XhIlSe3jGrI1lp1tVwjtSWzo8oVuEVhLlX-RY7s1yLBEk3gAz7vf6zZOJqhwMpWBfOVA9je8X89nXwranE69MB865TiCbl38ZCbLyaVinGDSmIpxSotLQiVK7EfnAee4YUHlXm56")',
                }}
              >
                <div className="flex w-full items-end justify-between gap-4 p-4">
                  <p className="text-white tracking-light text-2xl font-bold leading-tight flex-1">
                    Informazioni di Contatto
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-4 px-2 py-1">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#111714] text-base font-medium leading-normal pb-2">
                    Email
                  </p>
                  <input
                    name="email"
                    type="email"
                    placeholder="email@esempio.com"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111714] focus:outline-0 focus:ring-0 border border-[#dce5df] bg-white focus:border-[#dce5df] h-14 placeholder:text-[#648771] p-[15px] text-base font-normal leading-normal"
                    value={form.email}
                    onChange={handleChange}
                    required
                    readOnly={!!currentUser}
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-end gap-4 px-2 py-1">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#111714] text-base font-medium leading-normal pb-2">
                    Nome
                  </p>
                  <input
                    name="nome"
                    placeholder="Nome"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111714] focus:outline-0 focus:ring-0 border border-[#dce5df] bg-white focus:border-[#dce5df] h-14 placeholder:text-[#648771] p-[15px] text-base font-normal leading-normal"
                    value={form.nome}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-end gap-4 px-2 py-1">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#111714] text-base font-medium leading-normal pb-2">
                    Cognome
                  </p>
                  <input
                    name="cognome"
                    placeholder="Cognome"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111714] focus:outline-0 focus:ring-0 border border-[#dce5df] bg-white focus:border-[#dce5df] h-14 placeholder:text-[#648771] p-[15px] text-base font-normal leading-normal"
                    value={form.cognome}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-end gap-4 px-2 py-1">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#111714] text-base font-medium leading-normal pb-2">
                    Telefono
                  </p>
                  <input
                    name="telefono"
                    placeholder="Telefono"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111714] focus:outline-0 focus:ring-0 border border-[#dce5df] bg-white focus:border-[#dce5df] h-14 placeholder:text-[#648771] p-[15px] text-base font-normal leading-normal"
                    value={form.telefono}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-end gap-4 px-2 py-1">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#111714] text-base font-medium leading-normal pb-2">
                    Indirizzo
                  </p>
                  <div className="flex gap-2">
                    <input
                      name="via"
                      placeholder="Via"
                      className="form-input flex-1 rounded-xl rounded-r-none border-r-0 text-[#111714] focus:outline-0 focus:ring-0 border border-[#dce5df] bg-white focus:border-[#dce5df] h-14 placeholder:text-[#648771] p-[15px] text-base font-normal leading-normal"
                      value={form.via}
                      onChange={handleChange}
                      required
                    />
                    <input
                      name="numero"
                      placeholder="N°"
                      className="form-input w-20 rounded-xl rounded-l-none border-l-0 text-[#111714] focus:outline-0 focus:ring-0 border border-[#dce5df] bg-white focus:border-[#dce5df] h-14 placeholder:text-[#648771] p-[15px] text-base font-normal leading-normal"
                      value={form.numero}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>
              </div>
              <div className="flex flex-wrap items-end gap-4 px-2 py-1">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#111714] text-base font-medium leading-normal pb-2">
                    Città
                  </p>
                  <input
                    name="citta"
                    placeholder="Città"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111714] focus:outline-0 focus:ring-0 border border-[#dce5df] bg-white focus:border-[#dce5df] h-14 placeholder:text-[#648771] p-[15px] text-base font-normal leading-normal"
                    value={form.citta}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#111714] text-base font-medium leading-normal pb-2">
                    CAP
                  </p>
                  <input
                    name="cap"
                    placeholder="Codice Postale"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111714] focus:outline-0 focus:ring-0 border border-[#dce5df] bg-white focus:border-[#dce5df] h-14 placeholder:text-[#648771] p-[15px] text-base font-normal leading-normal"
                    value={form.cap}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-end gap-4 px-2 py-1">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#111714] text-base font-medium leading-normal pb-2">
                    Stato
                  </p>
                  <input
                    name="stato"
                    placeholder="Stato"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111714] focus:outline-0 focus:ring-0 border border-[#dce5df] bg-white focus:border-[#dce5df] h-14 placeholder:text-[#648771] p-[15px] text-base font-normal leading-normal"
                    value={form.stato}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-end gap-4 px-2 py-1">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#111714] text-base font-medium leading-normal pb-2">
                    Note per la consegna (opzionale)
                  </p>
                  <textarea
                    name="note"
                    placeholder="Note per la consegna"
                    className="form-input w-full rounded-xl border border-[#dce5df] bg-white focus:border-[#dce5df] p-[15px] text-base font-normal leading-normal text-[#111714] placeholder:text-[#648771] focus:outline-0 focus:ring-0 min-h-[48px]"
                    value={form.note}
                    onChange={handleChange}
                    rows={2}
                  />
                </label>
              </div>
              {error && (
                <div className="text-red-600 text-sm mt-2">{error}</div>
              )}
              <div className="flex gap-4 mt-6 px-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-full bg-[#e8f2ec] text-[#51946b] font-semibold hover:bg-[#d2e7db] border border-[#51946b]"
                  onClick={() => router.push("/cart")}
                  disabled={submitting}
                >
                  Torna al carrello
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#51946b] text-white font-semibold hover:bg-[#3a7d5a] shadow"
                  disabled={submitting}
                >
                  Procedi al pagamento
                </button>
              </div>
            </form>
            {/* Colonna destra: Riepilogo ordine */}
            <div className="w-full md:w-[360px] bg-white rounded-xl shadow p-4 h-fit ml-0 md:ml-8 mt-8 md:mt-0">
              <div
                className="bg-cover bg-center flex flex-col items-stretch justify-end rounded-xl pt-[60px] shadow-[0_0_4px_rgba(0,0,0,0.1)] mb-6"
                style={{
                  backgroundImage:
                    'linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAB300xVFvOOvhHfM-AKbym3kmRG5M6QVv0A9A1ePzZzz6sms1RXqQv71p11P5xCx0g_bDr2LUssu6VVoHGnjC9X95YlgsuheY_VFMS1_SpgWfLPxNiGfuOY_dwomhna3kWpaajpNTGfD8Cd8lKe83qSaqH9lQMjrhHEH79zeRFDmSmtI2NZqDgYgThnEWp-4NrEDlWICN6CwC2Z2izJHvAMw0HTsZwfzLdxs12QwQCPGb4UrBJwM3FNhUK18gtnfBZRbXoUQhwcvBA")',
                }}
              >
                <div className="flex w-full items-end justify-between gap-4 p-4">
                  <p className="text-white tracking-light text-2xl font-bold leading-tight flex-1">
                    Riepilogo Ordine
                  </p>
                </div>
              </div>
              <ul className="divide-y divide-[#e8f2ec] mb-4">
                {cartItems.map((item) => (
                  <li
                    key={item.productId}
                    className="py-2 flex justify-between items-center"
                  >
                    <span className="truncate max-w-[180px]">
                      {item.titolo} x{item.quantity}
                    </span>
                    <span className="text-[#51946b] font-semibold">
                      € {(item.prezzo * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between gap-x-6 py-2">
                <p className="text-[#648771] text-sm font-normal leading-normal">
                  Spedizione
                </p>
                <p className="text-[#111714] text-sm font-normal leading-normal text-right">
                  Gratuita
                </p>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t pt-4">
                <span>Totale</span>
                <span className="text-[#51946b]">€ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
