import type { CategoryNode, StoreSettings } from "@/lib/types";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";
import { MegaMenu } from "./MegaMenu";
import { HeaderActions, MenuButton } from "./HeaderActions";
import { TopBar } from "./TopBar";
import { Countdown } from "./Countdown";
import { CartDrawer } from "./CartDrawer";
import { MobileMenu } from "./MobileMenu";

export function Header({ tree, settings }: { tree: CategoryNode[]; settings: StoreSettings }) {
  return (
    <>
      {settings.countdown.attivo && settings.countdown.data && (
        <Countdown titolo={settings.countdown.titolo} data={settings.countdown.data} link={settings.countdown.link} />
      )}
      <TopBar settings={settings} />
      <header className="sticky top-0 z-40 border-b border-paper-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="relative">
          <div className="container flex h-[72px] items-center gap-3 lg:h-20 lg:gap-6">
            <MenuButton />
            <Logo priority />
            <SearchBox className="mx-auto hidden w-full max-w-xl md:block" />
            <div className="ml-auto md:ml-0">
              <HeaderActions />
            </div>
          </div>
          <div className="container pb-3 md:hidden">
            <SearchBox />
          </div>
          <div className="container hidden h-12 items-center border-t border-paper-line lg:flex">
            <MegaMenu tree={tree} />
          </div>
        </div>
      </header>
      <CartDrawer freeShippingThreshold={settings.spedizione.sogliaGratuita} />
      <MobileMenu tree={tree} settings={settings} />
    </>
  );
}
