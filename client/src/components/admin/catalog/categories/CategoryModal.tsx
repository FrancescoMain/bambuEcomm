"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SingleImageUploader } from "@/components/admin/ImageUploader";
import { Modal } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { api, errorMessage, revalidateStorefront } from "@/lib/api/client";
import type { Category } from "@/lib/types";
import { descendantIds, indentLabel, type FlatCategory } from "../categories";
import { useAutoFocus } from "../fields";

export type CategoryDraft = { mode: "create"; parentId: number | null } | { mode: "edit"; category: Category };

/** Creazione e modifica di una categoria */
export function CategoryModal({
  draft,
  categories,
  onClose,
  onSaved,
}: {
  draft: CategoryDraft | null;
  categories: FlatCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Modal open={!!draft} onClose={onClose} title={draft?.mode === "edit" ? "Modifica categoria" : "Nuova categoria"}>
      {draft && (
        <CategoryForm
          key={draft.mode === "edit" ? `e${draft.category.id}` : `c${draft.parentId}`}
          draft={draft}
          categories={categories}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}

function CategoryForm({
  draft,
  categories,
  onClose,
  onSaved,
}: {
  draft: CategoryDraft;
  categories: FlatCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = draft.mode === "edit" ? draft.category : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [parentId, setParentId] = useState<number | null>(editing ? editing.parentId : draft.mode === "create" ? draft.parentId : null);
  const [immagine, setImmagine] = useState<string | null>(editing?.immagine ?? null);
  const [ordine, setOrdine] = useState(String(editing?.ordine ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nameInput = useAutoFocus<HTMLInputElement>();

  // Una categoria non può stare dentro se stessa o dentro una sua sottocategoria
  const self = editing ? categories.find((c) => c.id === editing.id) : undefined;
  const blocked = new Set(self ? descendantIds(self.node) : []);
  const parents = categories.filter((c) => !blocked.has(c.id));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Scrivi il nome della categoria.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        immagine,
        ordine: parseInt(ordine, 10) || 0,
        parentId,
      };
      if (editing) await api(`/categories/${editing.id}`, { method: "PUT", body });
      else await api("/categories", { method: "POST", body });
      revalidateStorefront(["categories", "products"]);
      toast.success(editing ? "Categoria aggiornata." : `Categoria «${body.name}» creata.`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Salvataggio non riuscito."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Input
        ref={nameInput}
        label="Nome"
        required
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
        error={error}
        placeholder="Es. Quaderni"
        maxLength={80}
      />
      <Select
        label="Dove si trova"
        value={parentId ?? ""}
        onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
        hint="Scegli una categoria per farne una sottocategoria (es. Quaderni dentro Scuola)."
      >
        <option value="">Categoria principale (nel menu)</option>
        {parents.map((c) => (
          <option key={c.id} value={c.id}>
            Dentro: {indentLabel(c)}
          </option>
        ))}
      </Select>
      <Textarea
        label="Descrizione"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Facoltativa: compare in cima alla pagina della categoria."
      />
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <div className="w-48 max-w-full">
          <p className="field-label">Immagine</p>
          <SingleImageUploader value={immagine} onChange={setImmagine} folder="categories" aspect="aspect-[4/3]" />
        </div>
        <Input
          label="Posizione nel menu"
          inputMode="numeric"
          value={ordine}
          onChange={(e) => setOrdine(e.target.value.replace(/[^\d-]/g, ""))}
          hint="Numero più basso = più in alto. Puoi anche usare le frecce nell'elenco."
        />
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-paper-line pt-5 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Annulla
        </Button>
        <Button type="submit" loading={saving}>
          {editing ? "Salva modifiche" : "Crea categoria"}
        </Button>
      </div>
    </form>
  );
}
