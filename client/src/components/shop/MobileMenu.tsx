"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Heart, Package, Phone, User } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useUI } from "@/store/ui";
import { useAuth } from "@/store/auth";
import type { CategoryNode, StoreSettings } from "@/lib/types";
import { categoryPath, whatsappUrl } from "@/lib/urls";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "./icons";

function Branch({ node, depth = 0 }: { node: CategoryNode; depth?: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children.length > 0;
  return (
    <li>
      <div className="flex items-center">
        <Link
          href={categoryPath(node)}
          className="flex-1 py-3 text-[15px] font-semibold"
          style={{ paddingLeft: depth * 14 }}
        >
          {node.name}
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2 text-ink-muted"
            aria-expanded={open}
            aria-label={`Mostra sottocategorie di ${node.name}`}
          >
            <ChevronRight className={`h-5 w-5 transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <ul className="border-l-2 border-paper-line pl-2">
          {node.children.map((c) => (
            <Branch key={c.id} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function MobileMenu({ tree, settings }: { tree: CategoryNode[]; settings: StoreSettings }) {
  const open = useUI((s) => s.menuOpen);
  const close = useUI((s) => s.closeMenu);
  const user = useAuth((s) => s.user);
  const pathname = usePathname();

  useEffect(() => close(), [pathname, close]);

  return (
    <Drawer open={open} onClose={close} side="left" title={<Logo />}>
      <div className="px-5 py-4">
        <div className="mb-4 grid grid-cols-2 gap-2">
          <Link href="/offerte" className="rounded-2xl bg-magenta-soft p-3 text-center text-sm font-bold text-magenta-ink">
            Offerte
          </Link>
          <Link href="/novita" className="rounded-2xl bg-sky-soft p-3 text-center text-sm font-bold text-sky-ink">
            Novità
          </Link>
        </div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-muted">Categorie</p>
        <ul className="divide-y divide-paper-line">
          {tree.map((n) => (
            <Branch key={n.id} node={n} />
          ))}
          <li>
            <Link href="/prodotti" className="block py-3 text-[15px] font-semibold">
              Tutti i prodotti
            </Link>
          </li>
        </ul>

        <div className="mt-6 space-y-1 border-t border-paper-line pt-4 text-[15px]">
          <Link href={user ? "/account" : "/login"} className="flex items-center gap-3 py-2 font-medium">
            <User className="h-5 w-5 text-ink-muted" /> {user ? "Il mio account" : "Accedi o registrati"}
          </Link>
          {user && (
            <Link href="/account/ordini" className="flex items-center gap-3 py-2 font-medium">
              <Package className="h-5 w-5 text-ink-muted" /> I miei ordini
            </Link>
          )}
          <Link href="/preferiti" className="flex items-center gap-3 py-2 font-medium">
            <Heart className="h-5 w-5 text-ink-muted" /> Preferiti
          </Link>
          <Link href="/contatti" className="flex items-center gap-3 py-2 font-medium">
            <Phone className="h-5 w-5 text-ink-muted" /> Contatti e negozio
          </Link>
          <a
            href={whatsappUrl(settings.contatti.whatsapp, "Ciao! Vorrei informazioni sui vostri prodotti")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-2 font-medium text-brand-700"
          >
            <WhatsAppIcon className="h-5 w-5" /> Scrivici su WhatsApp
          </a>
        </div>
      </div>
    </Drawer>
  );
}
