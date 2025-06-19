"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RootState } from "@/redux/store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCurrentUserRequest } from "@/redux/authSlice";

const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 24 24"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
  </svg>
);

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 24 24"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
  </svg>
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menu = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Ordini", href: "/dashboard/ordini" },
    { label: "Prodotti", href: "/dashboard/prodotti" },
    { label: "Import Prodotti", href: "/dashboard/import-prodotti" },
  ];

  // Find the current page title for the mobile header
  const currentPage = menu
    .slice()
    .sort((a, b) => b.href.length - a.href.length) // Sort by href length descending
    .find((item) => pathname && pathname.startsWith(item.href));
  const pageTitle = currentPage ? currentPage.label : "Dashboard";

  useEffect(() => {
    console.log("Dashboard auth check:", { user, isLoading, token });

    if (isLoading) {
      console.log("Auth still loading, waiting...");
      return;
    }

    if (!token) {
      console.log("No token found, redirecting to login");
      router.replace("/login");
    } else if (!user) {
      console.log("Token exists but no user data, dispatching getCurrentUser");
      // Il token esiste ma non abbiamo i dati utente, probabilmente dobbiamo caricarli
      // Non reindirizzare immediatamente, potrebbe essere in caricamento
      dispatch(getCurrentUserRequest());
    } else if (user.role !== "ADMIN") {
      console.log("User is not admin:", user.role);
      router.replace("/");
    }
  }, [user, isLoading, token, router, dispatch]);

  if (isLoading || (token && !user)) {
    return <div>Loading...</div>;
  }
  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#f7faf8]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md h-16 flex items-center justify-between px-4 z-30">
        <div className="text-xl font-bold text-[#51946b]">{pageTitle}</div>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-gray-700 focus:outline-none"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-white shadow-lg flex flex-col py-8 px-0 fixed left-0 top-0 bottom-0 z-40 transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-4 mb-8">
          <div className="text-2xl font-bold text-[#51946b]">Admin</div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="lg:hidden text-gray-700 focus:outline-none"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex flex-col gap-2 px-2">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMenuOpen && setIsMenuOpen(false)}
              className={`px-4 py-2 rounded-lg font-medium text-base transition-colors duration-150 ${
                pathname === item.href
                  ? "bg-[#e8f2ec] text-[#51946b]"
                  : "text-[#111714] hover:bg-[#e8f2ec] hover:text-[#51946b]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black opacity-50 z-30"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 mt-16 lg:mt-0 lg:ml-64">
        {children}
      </main>
    </div>
  );
}
