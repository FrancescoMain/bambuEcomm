"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const HeaderStatic = () => {
  return (
    <div className="flex items-center gap-8">
      <div className="flex-shrink-0 flex items-center gap-4 text-[#0e1a13]">
        <div className="flex items-center">
          <Link href="/">
            <Image
              src="/bambu-logo.jpg"
              alt="Bambu Ecomm Logo"
              width={74}
              height={32}
              priority
            />
          </Link>
        </div>
      </div>
      {/* Navbar: visibile solo su md+ */}
      <div className="hidden md:flex items-center gap-9 category-menu">
        <div className="relative category-menu">
          <button
            className="flex items-center text-[#0e1a13] text-sm font-medium leading-normal bg-transparent border-none cursor-pointer gap-2"
            aria-label="Apri categoria"
            onClick={() => {
              // Toggle the category menu open/close
              const menu = document.getElementById("category-dropdown");
              if (menu) menu.classList.toggle("hidden");
            }}
          >
            Categorie
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
          {/* Dropdown menu */}
          <div
            id="category-dropdown"
            className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50 hidden"
          >
            <a
              href="#categoria1"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Categoria 1
            </a>
            <a
              href="#categoria2"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Categoria 2
            </a>
            <a
              href="#categoria3"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Categoria 3
            </a>
          </div>
        </div>
        <a
          href="#esplora"
          className="text-[#0e1a13] text-sm font-medium leading-normal hover:underline"
        >
          Esplora
        </a>
      </div>
    </div>
  );
};

export default HeaderStatic;
