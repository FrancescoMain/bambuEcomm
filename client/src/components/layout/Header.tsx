"use client";
import React, { useState } from "react";
import Image from "next/image"; // Import the Next.js Image component

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e8f2ec] px-10 py-3">
      <div className="flex items-center gap-8">
        <div className="flex-shrink-0 flex items-center gap-4 text-[#0e1a13]">
          <div className="flex items-center">
            <Image
              src="/bambu-logo.jpg"
              alt="Bambu Ecomm Logo"
              width={74}
              height={32}
              priority
            />
          </div>
        </div>
        {/* Navbar: visibile solo su md+ */}
        <div className="hidden md:flex items-center gap-9">
          <select className="text-[#0e1a13] text-sm font-medium leading-normal bg-transparent border-none cursor-pointer">
            <option value="giornali">Giornali</option>
            <option value="riviste">Riviste</option>
            <option value="fumetti">Fumetti</option>
          </select>
        </div>
      </div>
      <div className="flex flex-1 justify-end items-center gap-8">
        <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#e8f2ec] text-[#0e1a13] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
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
        <div className="relative">
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
              <a
                href="#"
                className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
              >
                Dashboard
              </a>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
              >
                Informazioni
              </a>
            </div>
          )}
        </div>
        <button
          className="md:hidden ml-2 p-2 rounded-lg bg-[#e8f2ec] text-[#0e1a13]"
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
      </div>
      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute top-0 left-0 w-3/4 max-w-xs h-full bg-white shadow-lg flex flex-col gap-6 p-6"
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
            <select className="text-[#0e1a13] text-sm font-medium leading-normal bg-transparent border-none cursor-pointer">
              <option value="giornali">Giornali</option>
              <option value="riviste">Riviste</option>
              <option value="fumetti">Fumetti</option>
            </select>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
