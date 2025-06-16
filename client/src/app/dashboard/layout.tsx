"use client";

import React from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RootState } from "@/redux/store";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const menu = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Ordini", href: "/dashboard/ordini" },
    { label: "Prodotti", href: "/dashboard/prodotti" },
    { label: "Import Prodotti", href: "/dashboard/import-prodotti" },
  ];

  useEffect(() => {
    if (isLoading) return;
    if (!user && !token) {
      router.replace("/login");
    } else if (user && user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [user, isLoading, token, router]);

  if (isLoading || (token && !user)) {
    return <div>Loading...</div>;
  }
  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#f7faf8]">
      <aside className="w-64 bg-white shadow-lg flex flex-col py-8 px-0 fixed left-0 top-0 bottom-0 z-20">
        <div className="text-2xl font-bold text-[#51946b] mb-8 px-4">Admin</div>
        <nav className="flex flex-col gap-2 px-2">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
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
      <main className="flex-1 p-8 ml-64">{children}</main>
    </div>
  );
}
