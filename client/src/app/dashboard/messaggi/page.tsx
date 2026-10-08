import type { Metadata } from "next";
import { Suspense } from "react";
import { MessagesView } from "@/components/admin/ops/messages/MessagesView";

export const metadata: Metadata = { title: "Messaggi" };

export default function MessaggiPage() {
  return (
    <Suspense fallback={null}>
      <MessagesView />
    </Suspense>
  );
}
