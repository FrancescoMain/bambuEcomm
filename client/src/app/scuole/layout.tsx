import type { Metadata } from "next";
import { ScuoleShell } from "@/components/scuole/ScuoleShell";

export const metadata: Metadata = {
  title: "Libri scolastici",
  robots: { index: false, follow: false },
};

export default function ScuoleLayout({ children }: { children: React.ReactNode }) {
  return <ScuoleShell>{children}</ScuoleShell>;
}
