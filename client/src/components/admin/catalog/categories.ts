"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, errorMessage } from "@/lib/api/client";
import type { Category, CategoryNode } from "@/lib/types";

/** Albero categorie: ordine manuale, poi alfabetico (come il negozio) */
export const buildCategoryTree = (categories: Category[]): CategoryNode[] => {
  const nodes = new Map<number, CategoryNode>(categories.map((c) => [c.id, { ...c, children: [] }]));
  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent && parent.id !== node.id) parent.children.push(node);
    else roots.push(node);
  }
  const sort = (list: CategoryNode[]) => {
    list.sort((a, b) => a.ordine - b.ordine || a.name.localeCompare(b.name, "it"));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
};

export interface FlatCategory {
  id: number;
  name: string;
  depth: number;
  /** "Scuola › Quaderni" */
  path: string;
  node: CategoryNode;
}

/** Lista piatta in ordine di albero, con profondità (per select e checklist) */
export const flattenTree = (tree: CategoryNode[]): FlatCategory[] => {
  const out: FlatCategory[] = [];
  const walk = (list: CategoryNode[], depth: number, prefix: string) => {
    for (const node of list) {
      const path = prefix ? `${prefix} › ${node.name}` : node.name;
      out.push({ id: node.id, name: node.name, depth, path, node });
      walk(node.children, depth + 1, path);
    }
  };
  walk(tree, 0, "");
  return out;
};

/** Id della categoria e di tutte le sue sottocategorie */
export const descendantIds = (node: CategoryNode): number[] => [
  node.id,
  ...node.children.flatMap((child) => descendantIds(child)),
];

/** Prodotti della categoria comprese le sottocategorie (stima: un prodotto può stare in più rami) */
export const subtreeProductCount = (node: CategoryNode): number =>
  node.productCount + node.children.reduce((sum, child) => sum + subtreeProductCount(child), 0);

/** Opzione indentata per i <select> */
export const indentLabel = (c: FlatCategory) => `${"   ".repeat(c.depth)}${c.depth ? "– " : ""}${c.name}`;

/** Carica le categorie dall'API e prepara albero e lista piatta */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const list = await api<Category[]>("/categories");
      setCategories(Array.isArray(list) ? list : []);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, "Impossibile caricare le categorie."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const flat = useMemo(() => flattenTree(tree), [tree]);
  return { categories, setCategories, tree, flat, loading, error, reload };
}
