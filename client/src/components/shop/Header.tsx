import type { CategoryNode, StoreSettings } from "@/lib/types";
import type { ActiveSeason } from "@/lib/seasonal";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";
import { MegaMenu } from "./MegaMenu";
import { HeaderActions, MenuButton } from "./HeaderActions";
import { TopBar } from "./TopBar";
import { Countdown } from "./Countdown";
import { CartDrawer } from "./CartDrawer";
import { MobileMenu } from "./MobileMenu";

export function Header({
  tree,
  settings,
  seasonal = null,
}: {
  tree: CategoryNode[];
  settings: StoreSettings;
  seasonal?: ActiveSeason | null;
}) {
  const halloween = seasonal?.tema === "halloween";
  return (
    <>
      {settings.countdown.attivo && settings.countdown.data && (
        <Countdown titolo={settings.countdown.titolo} data={settings.countdown.data} link={settings.countdown.link} />
      )}
      <TopBar settings={settings} halloween={halloween} />
      <header
        className={cn(
          "sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85",
          halloween ? "border-transparent" : "border-paper-line"
        )}
      >
        <div className="relative">
          <div className="container flex h-[72px] items-center gap-3 lg:h-20 lg:gap-6">
            <MenuButton />
            <Logo priority halloween={halloween} />
            <SearchBox className="mx-auto hidden w-full max-w-xl md:block" />
            <div className="ml-auto md:ml-0">
              <HeaderActions />
            </div>
          </div>
          <div className="container pb-3 md:hidden">
            <SearchBox />
          </div>
          <div className="container hidden h-12 items-center border-t border-paper-line lg:flex">
            <MegaMenu tree={tree} highlight={seasonal?.category ?? null} />
          </div>
        </div>
        {halloween && <div aria-hidden className="halloween-stripe h-1.5" />}
      </header>
      <CartDrawer freeShippingThreshold={settings.spedizione.sogliaGratuita} />
      <MobileMenu tree={tree} settings={settings} highlight={seasonal?.category ?? null} />
    </>
  );
}
