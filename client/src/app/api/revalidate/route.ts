import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api/server";

const ALLOWED = /^(products|categories|settings|posts|product:\d+|post:[a-z0-9-]+)$/;

/**
 * Invalida la cache delle pagine dopo una modifica dal pannello.
 * Accetta il segreto condiviso con l'API (REVALIDATE_SECRET) oppure il token
 * di un amministratore (verificato chiedendo all'API chi è l'utente).
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  let authorized = !!secret && request.headers.get("x-revalidate-secret") === secret;

  if (!authorized) {
    const auth = request.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      const me = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: auth }, cache: "no-store" });
      if (me.ok) authorized = (await me.json())?.role === "ADMIN";
    }
  }
  if (!authorized) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const tags: string[] = Array.isArray(body?.tags) ? body.tags.filter((t: unknown) => typeof t === "string" && ALLOWED.test(t)) : [];
  tags.forEach((tag) => revalidateTag(tag));
  return NextResponse.json({ ok: true, revalidated: tags });
}
