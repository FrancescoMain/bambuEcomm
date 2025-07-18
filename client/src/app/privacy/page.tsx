import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Privacy Policy | Cartoleria Bambù",
  description: "Privacy Policy di Cartoleria Bambù",
};

export default function PrivacyPage() {
  // Redirect to iubenda privacy policy
  redirect("https://www.iubenda.com/privacy-policy/33504144");
}
