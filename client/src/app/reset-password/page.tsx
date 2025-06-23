"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";
import { useLoading } from "@/components/layout/LoadingContext";
import authService from "@/api/authService";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { setLoading } = useLoading();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || null;

  useEffect(() => {
    if (!token) {
      toast.error("Token di reset non valido");
      router.push("/forgot-password");
    }
  }, [token, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Token di reset non valido");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Le password non coincidono");
      return;
    }

    if (password.length < 6) {
      toast.error("La password deve essere di almeno 6 caratteri");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPassword(token, password);

      setResetSuccess(true);
      toast.success(response.message || "Password aggiornata con successo!");

      // Reindirizza al login dopo 3 secondi
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Errore reset password:", error);
      toast.error(
        error.response?.data?.message ||
          "Errore nel reset della password. Il token potrebbe essere scaduto."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
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
              Password aggiornata!
            </h2>

            <p className="text-gray-600 mb-6">
              La tua password è stata aggiornata con successo. Verrai
              reindirizzato al login tra pochi secondi.
            </p>

            <Link
              href="/login"
              onClick={() => setLoading(true)}
              className="inline-block w-full bg-[#51946b] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#3d7a57] transition-colors"
            >
              Vai al Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nuova Password
          </h1>
          <p className="text-gray-600">Inserisci la tua nuova password</p>
        </div>

        {/* Reset Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nuova Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51946b] focus:border-transparent transition-all"
                placeholder="Inserisci la nuova password"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Conferma Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51946b] focus:border-transparent transition-all"
                placeholder="Conferma la nuova password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#51946b] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#3d7a57] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Aggiornamento...
                </>
              ) : (
                "Aggiorna Password"
              )}
            </button>
          </div>
        </form>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <Link
            href="/login"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Torna al login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Caricamento...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
