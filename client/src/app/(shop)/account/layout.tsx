import type { Metadata } from "next";
import { AccountHeader } from "@/components/account/AccountHeader";
import { RequireAuth } from "@/components/account/RequireAuth";

// Area personale: mai indicizzata
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AccountHeader />
      <div className="container py-8 sm:py-10">
        <RequireAuth>{children}</RequireAuth>
      </div>
    </>
  );
}
