import { redirect } from "next/navigation";
import { slugify } from "@/lib/format";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Vecchio indirizzo /search: rimanda alle nuove pagine catalogo */
export default async function LegacySearch({ searchParams }: Props) {
  const sp = await searchParams;
  const category = Array.isArray(sp.category) ? sp.category[0] : sp.category;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  if (category) redirect(`/categoria/${slugify(category)}`);
  redirect(q ? `/prodotti?q=${encodeURIComponent(q)}` : "/prodotti");
}
