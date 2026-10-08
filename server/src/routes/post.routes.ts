import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { clampInt, noStore, parseId, publicCache, revalidateStorefront } from "../lib/http";
import { slugify } from "../lib/catalog";

// Blog: articoli scritti dal pannello admin (testo in Markdown semplice)
const router = Router();
const admin = [authenticateToken, authorizeRole(["ADMIN"]), noStore];

const listSelect = {
  id: true,
  titolo: true,
  slug: true,
  estratto: true,
  copertina: true,
  pubblicato: true,
  publishedAt: true,
  updatedAt: true,
} satisfies Prisma.PostSelect;

// GET /api/posts — articoli pubblicati
router.get("/", publicCache(300, 3600), async (req: Request, res: Response) => {
  const limit = clampInt(req.query.limit, 12, 1, 50);
  const posts = await prisma.post.findMany({
    where: { pubblicato: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: listSelect,
  });
  res.json(posts);
});

// GET /api/posts/admin/all — tutti gli articoli (anche bozze)
router.get("/admin/all", ...admin, async (req: Request, res: Response) => {
  res.json(await prisma.post.findMany({ orderBy: { updatedAt: "desc" }, select: listSelect }));
});

// GET /api/posts/admin/:id — articolo completo per l'editor
router.get("/admin/:id", ...admin, async (req: Request, res: Response) => {
  const post = await prisma.post.findUnique({ where: { id: parseId(req.params.id) } });
  if (!post) {
    res.status(404).json({ message: "Articolo non trovato" });
    return;
  }
  res.json(post);
});

// GET /api/posts/:slug — articolo pubblicato
router.get("/:slug", publicCache(300, 3600), async (req: Request, res: Response) => {
  const post = await prisma.post.findFirst({ where: { slug: req.params.slug, pubblicato: true } });
  if (!post) {
    res.status(404).json({ message: "Articolo non trovato" });
    return;
  }
  res.json(post);
});

const readPost = (body: any) => {
  const data: Prisma.PostUpdateInput = {};
  if (body.titolo !== undefined) data.titolo = String(body.titolo).trim().slice(0, 200);
  if (body.slug !== undefined || body.titolo !== undefined) {
    data.slug = slugify(String(body.slug || body.titolo || "")).slice(0, 120);
  }
  if (body.estratto !== undefined) data.estratto = body.estratto ? String(body.estratto).slice(0, 400) : null;
  if (body.contenuto !== undefined) data.contenuto = String(body.contenuto);
  if (body.copertina !== undefined) data.copertina = body.copertina || null;
  if (body.pubblicato !== undefined) {
    data.pubblicato = !!body.pubblicato;
    if (body.pubblicato) data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : new Date();
  }
  return data;
};

router.post("/", ...admin, async (req: Request, res: Response) => {
  const data = readPost(req.body || {});
  if (!data.titolo || !data.contenuto || !data.slug) {
    res.status(400).json({ message: "Titolo e contenuto sono obbligatori." });
    return;
  }
  try {
    const post = await prisma.post.create({ data: data as Prisma.PostCreateInput });
    revalidateStorefront(["posts"]);
    res.status(201).json(post);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ message: "Esiste già un articolo con questo indirizzo (slug)." });
      return;
    }
    res.status(500).json({ message: "Errore nel salvataggio dell'articolo" });
  }
});

router.put("/:id", ...admin, async (req: Request, res: Response) => {
  try {
    const body = { ...(req.body || {}) };
    // Non rigenerare lo slug se cambia solo il titolo di un articolo già pubblicato
    if (body.slug === undefined) delete body.slug;
    const data = readPost(body);
    if (req.body?.slug === undefined) delete data.slug;
    const post = await prisma.post.update({ where: { id: parseId(req.params.id) }, data });
    revalidateStorefront(["posts", `post:${post.slug}`]);
    res.json(post);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ message: "Esiste già un articolo con questo indirizzo (slug)." });
      return;
    }
    res.status(500).json({ message: "Errore nel salvataggio dell'articolo" });
  }
});

router.delete("/:id", ...admin, async (req: Request, res: Response) => {
  await prisma.post.deleteMany({ where: { id: parseId(req.params.id) } });
  revalidateStorefront(["posts"]);
  res.json({ message: "Articolo eliminato" });
});

export default router;
