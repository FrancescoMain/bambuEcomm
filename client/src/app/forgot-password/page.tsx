"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";
import { useLoading } from "@/components/layout/LoadingContext";
import authService from "@/api/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { setLoading } = useLoading();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);

      setEmailSent(true);
      toast.success(response.message || "Email di reset inviata con successo!");
    } catch (error: any) {
      console.error("Errore forgot password:", error);
      toast.error(
        error.response?.data?.message ||
          "Errore nell'invio dell'email. Riprova più tardi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e8f2ec] to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center mb-6"
            >
              <Image
                src="/bambu-logo.jpg"
                alt="Cartolibreria Bambù"
                width={64}
                height={64}
                priority
                className="object-contain"
              />
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-[#51946b]">Bambù</h1>
                <p className="text-sm text-gray-600">Cartolibreria</p>
              </div>
            </Link>
          </div>

          {/* Success Message */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Email inviata!
            </h2>

            <p className="text-gray-600 mb-6">
              Abbiamo inviato le istruzioni per il reset della password a{" "}
              <span className="font-medium text-gray-900">{email}</span>
            </p>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                className="w-full bg-[#51946b] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#3d7a57] transition-colors"
              >
                Invia di nuovo
              </button>
              <Link
                href="/login"
                onClick={() => setLoading(true)}
                className="block w-full text-center py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Torna al login
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-[#51946b] transition-colors inline-flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Torna alla home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f2ec] to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center mb-6"
          >
            <Image
              src="/bambu-logo.jpg"
              alt="Cartolibreria Bambù"
              width={64}
              height={64}
              priority
              className="object-contain"
            />
            <div className="ml-3">
              <h1 className="text-2xl font-bold text-[#51946b]">Bambù</h1>
              <p className="text-sm text-gray-600">Cartolibreria</p>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Password dimenticata?
          </h2>
          <p className="text-gray-600">
            Inserisci la tua email e ti invieremo le istruzioni per reimpostare
            la password
          </p>
        </div>

        {/* Reset Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51946b] focus:border-transparent transition-colors"
                  placeholder="nome@email.com"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#51946b] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#3d7a57] focus:outline-none focus:ring-2 focus:ring-[#51946b] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Invio in corso...
                </>
              ) : (
                "Invia email di reset"
              )}
            </button>
          </form>{" "}
          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              onClick={() => setLoading(true)}
              className="text-[#51946b] hover:text-[#3d7a57] font-medium transition-colors inline-flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Torna al login
            </Link>{" "}
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            onClick={() => setLoading(true)}
            className="text-gray-600 hover:text-[#51946b] transition-colors inline-flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}
