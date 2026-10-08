"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CategoryNode } from "@/lib/types";
import { categoryPath } from "@/lib/urls";
import { cn } from "@/lib/cn";

const ACCENTS = ["bg-orange", "bg-magenta", "bg-leaf", "bg-sky"];

/** Menu principale desktop: categorie con pannello a tendina su 3 livelli */
export function MegaMenu({ tree }: { tree: CategoryNode[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  useEffect(() => setOpenId(null), [pathname]);

  const open = (id: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpenId(id), 90);
  };
  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpenId(null), 140);
  };

  return (
    <nav aria-label="Categorie" className="hidden lg:block" onMouseLeave={close}>
      <ul className="flex items-center gap-1">
        {tree.map((cat, i) => {
          const hasChildren = cat.children.length > 0;
          const isOpen = openId === cat.id;
          return (
            <li key={cat.id} className="static" onMouseEnter={() => (hasChildren ? open(cat.id) : close())}>
              <div className="flex items-center">
                <Link
                  href={categoryPath(cat)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[15px] font-semibold transition",
                    isOpen || pathname === categoryPath(cat) ? "bg-paper-warm text-ink" : "text-ink-soft hover:text-ink"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", ACCENTS[i % ACCENTS.length])} />
                  {cat.name}
                </Link>
                {hasChildren && (
                  <button
                    type="button"
                    className="-ml-2 rounded-full p-1.5 text-ink-muted hover:text-ink"
                    aria-expanded={isOpen}
                    aria-label={`Sottocategorie di ${cat.name}`}
                    onClick={() => setOpenId(isOpen ? null : cat.id)}
                  >
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                  </button>
                )}
              </div>

              {hasChildren && isOpen && (
                <div
                  className="absolute inset-x-0 top-full z-30 animate-fade-in border-t border-paper-line bg-white shadow-lift"
                  onMouseEnter={() => open(cat.id)}
                >
                  <div className="container grid grid-cols-12 gap-8 py-8">
                    <div className="col-span-9 grid grid-cols-3 gap-x-8 gap-y-6">
                      {cat.children.map((child) => (
                        <div key={child.id}>
                          <Link
                            href={categoryPath(child)}
                            className="text-[15px] font-bold text-ink hover:text-brand-600"
                          >
                            {child.name}
                          </Link>
                          {child.children.length > 0 && (
                            <ul className="mt-2 space-y-1.5">
                              {child.children.map((leaf) => (
                                <li key={leaf.id}>
                                  <Link href={categoryPath(leaf)} className="text-sm text-ink-muted hover:text-brand-600">
                                    {leaf.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                    <Link
                      href={categoryPath(cat)}
                      className="col-span-3 flex flex-col justify-end rounded-2xl bg-paper-warm bg-confetti p-6 transition hover:shadow-card"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Tutto in</p>
                      <p className="text-2xl font-extrabold">{cat.name}</p>
                      <p className="mt-1 text-sm font-semibold text-brand-600">
                        {cat.productCount} prodotti →
                      </p>
                    </Link>
                  </div>
                </div>
              )}
            </li>
          );
        })}
        <li>
          <Link
            href="/offerte"
            className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[15px] font-bold text-magenta-ink hover:bg-magenta-soft"
          >
            Offerte
          </Link>
        </li>
        <li>
          <Link
            href="/novita"
            className="rounded-full px-3.5 py-2 text-[15px] font-semibold text-ink-soft hover:text-ink"
          >
            Novità
          </Link>
        </li>
      </ul>
    </nav>
  );
}
