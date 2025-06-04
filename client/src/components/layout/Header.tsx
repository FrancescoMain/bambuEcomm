"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; // Importa da react-redux
import { RootState } from "@/redux/store"; // Importa RootState
import { getCurrentUserRequest, logoutRequest } from "@/redux/authSlice"; // Importa anche logoutRequest
// import { useAuthStore } from "@/store/authStore"; // Rimosso store Zustand
import HeaderStatic from "./HeaderStatic";

const Header = () => {
  const dispatch = useDispatch(); // Usa useDispatch
  const { user: currentUser, isLoading } = useSelector(
    (state: RootState) => state.auth
  ); // Seleziona dallo store Redux

  useEffect(() => {
    dispatch(getCurrentUserRequest()); // Dispatch dell'azione per ottenere l'utente
  }, [dispatch]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleClickOutside = (event: MouseEvent | TouchEvent) => {
    const target = event.target as HTMLElement;
    console.log("Clicked element:", target); // Log per debug

    if (
      !target.closest(".category-menu") && // Per chiudere il menu delle categorie
      !target.closest(".hamburger-menu") && // Per chiudere il menu hamburger
      !target.closest(".profile-menu") && // Per chiudere il menu profilo
      !target.closest(".cart-button") // Per chiudere il menu carrello
    ) {
      setMenuOpen(false);
      setProfileMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside); // Aggiunto per il supporto mobile
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logoutRequest());
    // Potresti voler aggiungere anche una notifica o un redirect qui
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e8f2ec] px-4 md:px-10 py-3">
      <HeaderStatic />
      <div className="flex flex-1 justify-end items-center gap-4  md:gap-8">
        {isLoading ? (
          <span>Loading...</span>
        ) : currentUser ? (
          <button className="text-sm font-bold hidden md:inline">
            {currentUser.name}
          </button>
        ) : (
          <a href="/login" className="text-sm font-bold">
            Login
          </a>
        )}
        <button
          className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#e8f2ec] text-[#0e1a13] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 cart-button"
          aria-label="Apri carrello"
        >
          <div
            className="text-[#0e1a13]"
            data-icon="ShoppingBag"
            data-size="20px"
            data-weight="regular"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20px"
              height="20px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM176,88a48,48,0,0,1-96,0,8,8,0,0,1,16,0,32,32,0,0,0,64,0,8,8,0,0,1,16,0Z"></path>
            </svg>
          </div>
        </button>
        <button
          className="md:hidden ml-2 p-2 rounded-lg bg-[#e8f2ec] text-[#0e1a13] hamburger-menu"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Apri menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5"
            />
          </svg>
        </button>
        {currentUser && (
          <div className="relative profile-menu">
            <button
              className="hidden md:flex bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCyYqkvxBHMRZhQXlELKzPCtdW-vqwBt8jKo2Dt_lV4ZyRk4UUvREYy-74B4Y_9OW6EjNbruNBM0GrrrE9XCC86Kwa8zrQGuTKvKkFl6XDNgeu7qF0oZFJr-R8PyxEtdlkdcHCcxWp3MvDY-IRUvvNmVXjnqe1jbeaEY7UgbNWvmprGwfCp8SDyjfow3Qn4KRqTeS_e8_LO17l3Idp-ZCtYmEl30LF_YSEFL1XFYeXyfYR6DwETvFLdpGE6J-drwJYxm75_2L0IgIyZ')",
              }}
              onClick={() => setProfileMenuOpen((v) => !v)}
              aria-label="Apri menu profilo"
            ></button>
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2">
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
                >
                  I miei Ordini
                </a>
                {currentUser.role === "ADMIN" && (
                  <a
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
                  >
                    Dashboard
                  </a>
                )}
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
                >
                  Informazioni
                </a>
                <a
                  href="#logout"
                  className="block px-4 py-2 text-sm text-red-500 hover:bg-[#e8f2ec]"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  Logout
                </a>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute top-0 left-0 w-3/4 max-w-xs h-full bg-white shadow-lg flex flex-col gap-6 p-6 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="self-end mb-4"
              onClick={() => setMenuOpen(false)}
              aria-label="Chiudi menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex flex-col gap-4">
              <h2 className="text-[#0e1a13] text-lg font-bold">Categorie</h2>
              <a
                href="#giornali"
                className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
              >
                Giornali
              </a>
              <a
                href="#riviste"
                className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
              >
                Riviste
              </a>
              <a
                href="#fumetti"
                className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
              >
                Fumetti
              </a>
            </div>
            {currentUser && (
              <div className="flex flex-col gap-4 mt-6">
                <h2 className="text-[#0e1a13] text-lg font-bold">Profilo</h2>
                <a
                  href="#informazioni"
                  className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
                >
                  Informazioni
                </a>
                {currentUser.role === "ADMIN" && (
                  <a
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
                  >
                    Dashboard
                  </a>
                )}
                <a
                  href="#ordini"
                  className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
                >
                  Ordini
                </a>
                <a
                  href="#logout"
                  className="block px-4 py-2 text-sm text-red-500 hover:bg-[#e8f2ec]"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  Logout
                </a>
              </div>
            )}
            <a
              href="#esplora"
              className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec] mt-6"
            >
              Esplora
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
