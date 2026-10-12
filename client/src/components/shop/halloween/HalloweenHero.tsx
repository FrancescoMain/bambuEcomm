import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Bat, Moon, Pumpkin } from "./art";

/** Banner notturno in cima alla home durante il periodo di Halloween */
export function HalloweenHero({ titolo, sottotitolo, href }: { titolo: string; sottotitolo: string; href: string | null }) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b0f2e] via-[#2c1248] to-[#120a1f] text-white">
      {/* stelline */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 12% 22%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 28% 68%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 46% 14%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 64% 38%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 82% 76%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 92% 18%, #fff 50%, transparent 51%)",
        }}
      />
      <Moon className="absolute -right-6 -top-8 -z-10 h-40 w-40 opacity-90 sm:right-10 sm:top-6 sm:h-44 sm:w-44" />
      <Bat className="halloween-flap absolute right-[38%] top-8 -z-10 hidden w-14 text-black/80 md:block" />
      <Bat className="halloween-flap absolute right-[22%] top-24 -z-10 w-10 text-black/70 [animation-delay:-0.6s]" />

      <div className="grid items-center gap-6 p-7 sm:p-10 md:grid-cols-[minmax(0,1fr)_auto] lg:p-14">
        <div className="max-w-xl">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-orange px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#1b0f2e]">
            Speciale Halloween
          </span>
          <h2 className="mt-4 text-balance text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            {titolo}
          </h2>
          {sottotitolo && <p className="mt-3 max-w-md text-lg text-white/80">{sottotitolo}</p>}
          {href && (
            <Link
              href={href}
              className="group mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-orange px-6 py-3.5 text-[15px] font-bold text-[#1b0f2e] transition hover:bg-[#ffa047]"
            >
              Scopri la collezione
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
        <div className="flex items-end justify-center gap-1 md:justify-end" aria-hidden>
          <Pumpkin className="h-14 w-14 sm:h-24 sm:w-24" />
          <Pumpkin className="h-24 w-24 sm:h-40 sm:w-40" />
          <Pumpkin className="h-12 w-12 sm:h-20 sm:w-20" />
        </div>
      </div>
    </section>
  );
}
