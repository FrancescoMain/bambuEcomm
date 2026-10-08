import type { Metadata } from "next";
import { NewsletterView } from "@/components/admin/ops/newsletter/NewsletterView";

export const metadata: Metadata = { title: "Newsletter" };

export default function NewsletterPage() {
  return <NewsletterView />;
}
