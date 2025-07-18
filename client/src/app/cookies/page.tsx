import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cookie Policy | Cartoleria Bambù",
  description: "Cookie Policy di Cartoleria Bambù",
};

export default function CookiesPage() {
  // Redirect to iubenda cookie policy
  redirect("https://www.iubenda.com/privacy-policy/33504144/cookie-policy");
}
