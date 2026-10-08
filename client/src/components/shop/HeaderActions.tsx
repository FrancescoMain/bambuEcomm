"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Heart, LayoutDashboard, LogOut, Menu, Package, ShoppingBag, User } from "lucide-react";
import { useAuth, isAdmin } from "@/store/auth";
import { cartCount, useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/cn";

/** Evita differenze tra HTML del server e browser per i dati salvati in localStorage */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

const iconBtn =
  "relative flex h-11 w-11 items-center justify-center rounded-full text-ink-soft transition hover:bg-paper-warm hover:text-ink";

function CountBubble({ n, tone = "bg-brand-600" }: { n: number; tone?: string }) {
  if (n <= 0) return null;
  return (
    <span
      className={cn(
        "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white ring-2 ring-white",
        tone
      )}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function MenuButton() {
  const openMenu = useUI((s) => s.openMenu);
  return (
    <button type="button" onClick={openMenu} className={cn(iconBtn, "lg:hidden")} aria-label="Apri menu">
      <Menu className="h-6 w-6" />
    </button>
  );
}

function AccountMenu() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) {
    return (
      <Link href="/login" className={iconBtn} aria-label="Accedi">
        <User className="h-[22px] w-[22px]" />
      </Link>
    );
  }

  const initial = (user.name || user.email).trim().charAt(0).toUpperCase();
  const item = "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={iconBtn}
        aria-expanded={open}
        aria-label="Il mio account"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
          {initial}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-40 w-60 animate-pop-in rounded-2xl border border-paper-line bg-white p-2 shadow-lift">
          <div className="px-3 pb-2 pt-1">
            <p className="truncate text-sm font-bold">{user.name || "Il mio account"}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>
          <Link href="/account" className={item} onClick={() => setOpen(false)}>
            <User className="h-4 w-4" /> Il mio account
          </Link>
          <Link href="/account/ordini" className={item} onClick={() => setOpen(false)}>
            <Package className="h-4 w-4" /> I miei ordini
          </Link>
          <Link href="/preferiti" className={item} onClick={() => setOpen(false)}>
            <Heart className="h-4 w-4" /> Preferiti
          </Link>
          {isAdmin(user) && (
            <Link href="/dashboard" className={cn(item, "text-brand-700")} onClick={() => setOpen(false)}>
              <LayoutDashboard className="h-4 w-4" /> Pannello negozio
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
              useCart.getState().clear();
              useWishlist.getState().clear();
            }}
            className={cn(item, "w-full")}
          >
            <LogOut className="h-4 w-4" /> Esci
          </button>
        </div>
      )}
    </div>
  );
}

export function HeaderActions() {
  const mounted = useMounted();
  const count = useCart((s) => cartCount(s.lines));
  const wishCount = useWishlist((s) => s.ids.length);
  const openCart = useUI((s) => s.openCart);

  return (
    <div className="flex items-center gap-0.5">
      <AccountMenu />
      <Link href="/preferiti" className={cn(iconBtn, "hidden sm:flex")} aria-label="Preferiti">
        <Heart className="h-[22px] w-[22px]" />
        {mounted && <CountBubble n={wishCount} tone="bg-magenta" />}
      </Link>
      <button type="button" onClick={openCart} className={iconBtn} aria-label={`Carrello (${mounted ? count : 0})`}>
        <ShoppingBag className="h-[22px] w-[22px]" />
        {mounted && <CountBubble n={count} />}
      </button>
    </div>
  );
}
