import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { cn } from "@/lib/cn";

/** Markdown -> HTML ripulito, generato sul server (nessun JS nel browser) */
export async function renderMarkdown(source: string) {
  return sanitizeHtml(await marked.parse(source || ""), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h2", "h3"]),
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ["src", "alt"] },
    // Il titolo della pagina è già l'unico h1
    transformTags: { h1: "h2" },
  });
}

export async function Markdown({ source, className }: { source: string; className?: string }) {
  const html = await renderMarkdown(source);
  return <div className={cn("prose-bambu", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
