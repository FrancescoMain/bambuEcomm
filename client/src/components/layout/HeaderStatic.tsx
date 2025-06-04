"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategoriesStart } from "@/redux/categorySlice";
import {
  selectParentCategories,
  selectCategoriesLoading,
} from "@/redux/categorySelectors";

const HeaderStatic = () => {
  const dispatch = useDispatch();
  const parentCategories = useSelector(selectParentCategories);
  const categoriesLoading = useSelector(selectCategoriesLoading);

  useEffect(() => {
    dispatch(fetchCategoriesStart());
  }, [dispatch]);

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
          {/* Dropdown menu dinamico */}
          <div
            id="category-dropdown"
            className="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded shadow-lg z-50 hidden"
          >
            {categoriesLoading ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                Caricamento...
              </div>
            ) : parentCategories.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                Nessuna categoria
              </div>
            ) : (
              parentCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={{ pathname: "/search", query: { category: cat.name } }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 truncate"
                  title={cat.name}
                  onClick={() => {
                    const menu = document.getElementById("category-dropdown");
                    if (menu) menu.classList.add("hidden");
                  }}
                >
                  {cat.name}
                </Link>
              ))
            )}
          </div>
        </div>
        <a
          href="/search"
          className="text-[#0e1a13] text-sm font-medium leading-normal hover:underline"
        >
          Esplora
        </a>
      </div>
    </div>
  );
};

export default HeaderStatic;
