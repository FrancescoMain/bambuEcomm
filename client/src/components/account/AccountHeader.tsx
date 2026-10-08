"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, Package, User } from "lucide-react";
import { isAdmin, useAuth } from "@/store/auth";
import { cn } from "@/lib/cn";
import { Breadcrumbs, type Crumb } from "@/components/shop/Breadcrumbs";
import { Skeleton } from "@/components/ui/Spinner";
import { signOut } from "./session";

const PAGES: Record<string, { title: string; crumbs: Crumb[] }> = {
  "/account": { title: "Il mio account", crumbs: [{ label: "Il mio account" }] },
  "/account/ordini": {
    title: "I miei ordini",
    crumbs: [{ label: "Il mio account", href: "/account" }, { label: "I miei ordini" }],
  },
};

const TABS = [
  { href: "/account", label: "Profilo", icon: User },
  { href: "/account/ordini", label: "I miei ordini", icon: Package },
  { href: "/preferiti", label: "Preferiti", icon: Heart },
];

const tab =
  "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t-2xl px-4 py-3 text-sm font-bold transition";

/** Intestazione dell'area personale: saluto e schede come le linguette di un raccoglitore */
export function AccountHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const page = PAGES[pathname] ?? PAGES["/account"];
  const first = user?.name?.trim().split(/\s+/)[0];

  return (
    <header className="border-b border-paper-line bg-paper-warm bg-confetti">
      <div className="container pt-8 sm:pt-10">
        <Breadcrumbs items={page.crumbs} className="mb-5" />
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xl font-extrabold text-white shadow-sm"
            aria-hidden
          >
            {user ? (user.name || user.email).trim().charAt(0).toUpperCase() : ""}
          </span>
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold sm:text-4xl">{page.title}</h1>
            {user ? (
              <p className="mt-0.5 truncate text-[15px] text-ink-muted">
                Ciao{first ? ` ${first}` : ""}! · {user.email}
              </p>
            ) : (
              <Skeleton className="mt-2 h-4 w-56" />
            )}
          </div>
        </div>

        <nav aria-label="Area personale" className="-mb-px mt-7 flex gap-1 overflow-x-auto scrollbar-none">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  tab,
                  active
                    ? "border border-b-0 border-paper-line bg-paper text-ink"
                    : "text-ink-muted hover:bg-white/60 hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden /> {label}
              </Link>
            );
          })}
          {isAdmin(user) && (
            <Link href="/dashboard" className={cn(tab, "text-brand-700 hover:bg-white/60")}>
              <LayoutDashboard className="h-4 w-4" aria-hidden /> Pannello negozio
            </Link>
          )}
          {user && (
            <button
              type="button"
              onClick={() => signOut((path) => router.push(path))}
              className={cn(tab, "ml-auto text-ink-muted hover:bg-white/60 hover:text-magenta-ink")}
            >
              <LogOut className="h-4 w-4" aria-hidden /> Esci
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
