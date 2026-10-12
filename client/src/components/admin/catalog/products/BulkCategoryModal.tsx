"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { api, errorMessage, revalidateStorefront } from "@/lib/api/client";
import { indentLabel, type FlatCategory } from "../categories";
import { pluralize } from "../utils";

/** Aggiunge (o toglie) una categoria a tutti i prodotti selezionati, senza toccare le altre */
export function BulkCategoryModal({
  ids,
  categories,
  onClose,
  onDone,
}: {
  ids: number[] | null;
  categories: FlatCategory[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [busy, setBusy] = useState<"add" | "remove" | null>(null);

  useEffect(() => {
    if (!ids) return;
    // Proposta comoda nel periodo di Halloween
    const halloween = categories.find((c) => c.name.trim().toLowerCase() === "halloween");
    setCategoryId((current) => current || (halloween ? String(halloween.id) : ""));
  }, [ids, categories]);

  const run = async (mode: "add" | "remove") => {
    if (!ids?.length || !categoryId) return;
    const name = categories.find((c) => String(c.id) === categoryId)?.name ?? "";
    setBusy(mode);
    try {
      const res = await api<{ updated: number }>("/products/bulk", {
        method: "PATCH",
        body: { productIds: ids, [mode === "add" ? "addCategoryId" : "removeCategoryId"]: Number(categoryId) },
      });
      const n = pluralize(res.updated ?? ids.length, "prodotto", "prodotti");
      toast.success(mode === "add" ? `${n} aggiunti a «${name}».` : `${n} tolti da «${name}».`);
      revalidateStorefront(["products", "categories"]);
      onDone();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e, "Non è stato possibile aggiornare le categorie."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open={!!ids} onClose={onClose} title="Aggiungi a categoria">
      <p className="mb-4 text-sm text-ink-muted">
        {pluralize(ids?.length ?? 0, "prodotto selezionato", "prodotti selezionati")}: le categorie che hanno già
        restano, viene solo aggiunta (o tolta) quella scelta.
      </p>
      <Select label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">Scegli…</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {indentLabel(c)}
          </option>
        ))}
      </Select>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => run("remove")} disabled={!categoryId || busy !== null}>
          {busy === "remove" ? "Rimozione…" : "Togli da questa categoria"}
        </Button>
        <Button onClick={() => run("add")} disabled={!categoryId || busy !== null}>
          {busy === "add" ? "Aggiunta…" : "Aggiungi"}
        </Button>
      </div>
    </Modal>
  );
}
