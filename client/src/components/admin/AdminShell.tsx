"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgePercent,
  FileText,
  FolderTree,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  RotateCcw,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Upload,
  X,
} from "lucide-react";
import { useAuth, isAdmin } from "@/store/auth";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

export const ADMIN_NAV = [
  { href: "/dashboard", label: "Riepilogo", icon: LayoutDashboard },
  { href: "/dashboard/ordini", label: "Ordini", icon: ShoppingBag },
  { href: "/dashboard/prodotti", label: "Prodotti", icon: Package },
  { href: "/dashboard/categorie", label: "Categorie", icon: FolderTree },
  { href: "/dashboard/promozioni", label: "Sconti e coupon", icon: BadgePercent },
  { href: "/dashboard/messaggi", label: "Messaggi", icon: Inbox },
  { href: "/dashboard/recensioni", label: "Recensioni", icon: Star },
  { href: "/dashboard/recessi", label: "Recessi", icon: RotateCcw },
  { href: "/dashboard/newsletter", label: "Newsletter", icon: Mail },
  { href: "/dashboard/blog", label: "Blog", icon: FileText },
  { href: "/dashboard/import-prodotti", label: "Importa prodotti", icon: Upload },
  { href: "/dashboard/impostazioni", label: "Impostazioni negozio", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5">
      {ADMIN_NAV.map((item) => {
        const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition",
              active ? "bg-brand-600 text-white shadow-sm" : "text-ink-soft hover:bg-paper-warm hover:text-ink"
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Struttura del pannello: menu laterale, controllo accesso admin, area contenuti */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (ready && !user) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
  }, [ready, user, router, pathname]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand-600">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!isAdmin(user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-extrabold">Area riservata</h1>
        <p className="text-ink-muted">Questa sezione è accessibile solo agli amministratori del negozio.</p>
        <Link href="/" className="font-bold text-brand-600">
          Torna al negozio
        </Link>
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 pt-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Store className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-[15px] font-extrabold leading-tight">Bambù</span>
          <span className="block text-xs text-ink-muted">Pannello negozio</span>
        </span>
      </Link>
      <div className="flex-1 overflow-y-auto">
        <NavLinks onNavigate={() => setMenuOpen(false)} />
      </div>
      <div className="space-y-1 border-t border-paper-line pt-4">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-paper-warm">
          <Home className="h-4 w-4" /> Vai al negozio
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-paper-warm"
        >
          <LogOut className="h-4 w-4" /> Esci ({user.name || user.email})
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-paper-line bg-white lg:block print:hidden">
        {sidebar}
      </aside>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-paper-line bg-white px-4 lg:hidden print:hidden">
        <button type="button" onClick={() => setMenuOpen(true)} className="rounded-full p-2" aria-label="Apri menu">
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-bold">Pannello negozio</span>
        <Link href="/" className="rounded-full p-2" aria-label="Vai al negozio">
          <Home className="h-5 w-5" />
        </Link>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 animate-slide-in-left bg-white">
            <button type="button" onClick={() => setMenuOpen(false)} className="absolute right-3 top-3 rounded-full p-2" aria-label="Chiudi menu">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
