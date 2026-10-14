"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { api, errorMessage, revalidateStorefront } from "@/lib/api/client";
import { pluralize } from "../utils";

/** Imposta (o toglie) la stessa marca su tutti i prodotti selezionati */
export function BulkBrandModal({
  ids,
  onClose,
  onDone,
}: {
  ids: number[] | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [marca, setMarca] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [busy, setBusy] = useState<"set" | "clear" | null>(null);

  useEffect(() => {
    if (!ids) return;
    setMarca("");
    api<{ name: string }[]>("/products/brands", { auth: false })
      .then((list) => setBrands(Array.isArray(list) ? list.map((b) => b.name) : []))
      .catch(() => undefined);
  }, [ids]);

  // Se il nome coincide con una marca esistente (maiuscole a parte) si usa quella grafia
  const resolved = () => {
    const value = marca.trim();
    return brands.find((b) => b.toLowerCase() === value.toLowerCase()) ?? value;
  };

  const run = async (mode: "set" | "clear") => {
    if (!ids?.length) return;
    const value = mode === "set" ? resolved() : null;
    if (mode === "set" && !value) return;
    setBusy(mode);
    try {
      const res = await api<{ updated: number }>("/products/bulk", {
        method: "PATCH",
        body: { productIds: ids, marca: value },
      });
      const n = pluralize(res.updated ?? ids.length, "prodotto", "prodotti");
      toast.success(value ? `Marca «${value}» impostata su ${n}.` : `Marca tolta da ${n}.`);
      revalidateStorefront(["products"]);
      onDone();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e, "Non è stato possibile aggiornare la marca."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open={!!ids} onClose={onClose} title="Imposta marca">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run("set");
        }}
      >
        <p className="mb-4 text-sm text-ink-muted">
          {pluralize(ids?.length ?? 0, "prodotto selezionato", "prodotti selezionati")}: la marca scelta sostituisce
          quella che hanno adesso.
        </p>
        <Input
          label="Marca"
          list="marche-bulk"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          placeholder="Es. Legami"
          hint="Scegli dall'elenco o scrivine una nuova."
          autoComplete="off"
          maxLength={80}
          autoFocus
        />
        <datalist id="marche-bulk">
          {brands.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => run("clear")} disabled={busy !== null}>
            {busy === "clear" ? "Rimozione…" : "Togli la marca"}
          </Button>
          <Button type="submit" disabled={!marca.trim() || busy !== null}>
            {busy === "set" ? "Salvataggio…" : "Imposta marca"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
