import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsView } from "@/components/admin/ops/settings/SettingsView";

export const metadata: Metadata = { title: "Impostazioni negozio" };

export default function ImpostazioniPage() {
  return (
    <Suspense fallback={null}>
      <SettingsView />
    </Suspense>
  );
}
