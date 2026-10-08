"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, PackageX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GalleryUploader } from "@/components/admin/ImageUploader";
import { PageTitle } from "@/components/admin/PageTitle";
import { useConfirm } from "@/components/admin/useConfirm";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { api, ApiError, errorMessage, revalidateStorefront } from "@/lib/api/client";
import type { Product } from "@/lib/types";
import { productPath } from "@/lib/urls";
import { useCategories } from "../categories";
import { CategoryChecklist } from "../CategoryChecklist";
import { SectionCard } from "../fields";
import { listHref } from "../products/filters";
import { useProductActions } from "../products/useProductActions";
import {
  emptyForm,
  ERROR_SECTION,
  formFromProduct,
  formSignature,
  toPayload,
  validateForm,
  type FormErrorKey,
  type FormErrors,
  type ProductFormState,
} from "./formState";
import { PriceSection } from "./PriceSection";
import { SaveBar } from "./SaveBar";
import { InfoSection, OptionsSection, PreviewCard, VisibilitySection } from "./Sections";
import { useUnsavedChanges } from "./useUnsavedChanges";
import { VariantsEditor } from "./VariantsEditor";

/** Errori da togliere quando l'utente modifica un campo */
const FIELD_ERRORS: Partial<Record<keyof ProductFormState, FormErrorKey[]>> = {
  titolo: ["titolo"],
  prezzo: ["prezzo", "sale"],
  saleOn: ["sale", "saleDates"],
  saleMode: ["sale"],
  saleValue: ["sale"],
  saleSchedule: ["saleDates"],
  saleStart: ["saleDates"],
  saleEnd: ["saleDates"],
  categoriaIds: ["categorie"],
  varianti: ["varianti"],
  etichettaPersonalizzazione: ["etichetta"],
  maxPerOrdine: ["maxPerOrdine"],
  stock: ["stock"],
};

const SECTION_ORDER = [
  "sezione-info",
  "sezione-prezzo",
  "sezione-immagini",
  "sezione-categorie",
  "sezione-varianti",
  "sezione-opzioni",
];

type ProductResponse = { message: string; product: Product };

/** Modulo unico per creare e modificare un prodotto */
export function ProductEditor({ productId }: { productId?: number }) {
  const router = useRouter();
  const isNew = productId === undefined;
  const [original, setOriginal] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [saved, setSaved] = useState<ProductFormState>(emptyForm);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "error">(isNew ? "ready" : "loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const { flat: categories, loading: categoriesLoading } = useCategories();
  const [confirm, confirmDialog] = useConfirm();

  const dirty = status === "ready" && formSignature(form) !== formSignature(saved);
  const leave = useUnsavedChanges(dirty && !saving, confirm);

  useEffect(() => {
    api<{ name: string }[]>("/products/brands", { auth: false })
      .then((list) => setBrands(Array.isArray(list) ? list.map((b) => b.name) : []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isNew) return;
    let alive = true;
    api<Product>(`/products/${productId}`)
      .then((p) => {
        if (!alive) return;
        const f = formFromProduct(p);
        setOriginal(p);
        setForm(f);
        setSaved(f);
        setStatus("ready");
      })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError && (e.status === 404 || e.status === 400)) setStatus("notfound");
        else {
          setLoadError(errorMessage(e, "Impossibile caricare il prodotto."));
          setStatus("error");
        }
      });
    return () => {
      alive = false;
    };
  }, [isNew, productId]);

  const set = useCallback(<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    const related = FIELD_ERRORS[key];
    if (related) {
      setErrors((prev) => {
        if (!related.some((k) => prev[k])) return prev;
        const next = { ...prev };
        related.forEach((k) => delete next[k]);
        return next;
      });
    }
  }, []);

  // Azioni rapide (eliminazione, disponibilità) già salvate sul server: aggiornano anche la copia salvata
  const actions = useProductActions({
    confirm,
    onPatch: (_id, patch) => {
      if (patch.available === undefined) return;
      const available = patch.available;
      setForm((f) => ({ ...f, available }));
      setSaved((f) => ({ ...f, available }));
    },
    onRemoved: () => {
      setSaved(form);
      router.push(listHref());
    },
  });

  const save = async () => {
    if (saving) return;
    const found = validateForm(form);
    setErrors(found);
    const keys = Object.keys(found) as FormErrorKey[];
    if (keys.length) {
      toast.error(keys.length === 1 ? found[keys[0]] : "Alcuni campi vanno sistemati: li trovi evidenziati in rosso.");
      const first = SECTION_ORDER.find((id) => keys.some((k) => ERROR_SECTION[k] === id));
      if (first) document.getElementById(first)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setSaving(true);
    try {
      const body = toPayload(form, original);
      const res = isNew
        ? await api<ProductResponse>("/products", { method: "POST", body })
        : await api<ProductResponse>(`/products/${productId}`, { method: "PUT", body });
      revalidateStorefront(["products", `product:${res.product.id}`]);
      setSaved(form);
      toast.success(isNew ? "Prodotto creato: ora è nel catalogo." : "Modifiche salvate.");
      router.push(listHref());
    } catch (e) {
      toast.error(errorMessage(e, "Salvataggio non riuscito, riprova."));
      setSaving(false);
    }
  };

  // Ctrl/Cmd + S salva
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    if (status !== "ready") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  const backButton = (
    <button
      type="button"
      onClick={() => void leave(listHref())}
      className="mb-3 inline-flex items-center gap-1.5 rounded-full py-1 pr-2 text-sm font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" /> Tutti i prodotti
    </button>
  );

  if (status === "notfound" || status === "error") {
    return (
      <div>
        {backButton}
        <div className="card">
          <EmptyState
            icon={<PackageX className="h-7 w-7" />}
            title={status === "notfound" ? "Prodotto non trovato" : "Non riesco a caricare il prodotto"}
            text={status === "notfound" ? "Potrebbe essere stato eliminato." : loadError}
            action={<LinkButton href="/dashboard/prodotti">Torna ai prodotti</LinkButton>}
          />
        </div>
      </div>
    );
  }

  if (status === "loading") return <EditorSkeleton />;

  return (
    <div className="pb-28">
      {backButton}
      <PageTitle
        title={isNew ? "Nuovo prodotto" : "Modifica prodotto"}
        description={isNew ? "Compila i campi e premi «Salva prodotto». I campi con * sono obbligatori." : original?.titolo}
        actions={
          original ? (
            <>
              <a
                href={productPath(original)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-paper-line bg-white px-5 text-[15px] font-semibold text-ink transition-colors hover:border-ink-faint hover:bg-paper"
              >
                <ExternalLink className="h-4 w-4" /> Vedi nel negozio
              </a>
              <Button
                variant="ghost"
                className="text-magenta-ink hover:bg-magenta-soft"
                loading={actions.isBusy(original.id, "delete")}
                onClick={() => void actions.remove({ ...original, available: form.available })}
              >
                <Trash2 className="h-4 w-4" /> Elimina
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <InfoSection form={form} set={set} errors={errors} brands={brands} />
          <PriceSection form={form} set={set} errors={errors} />
          <SectionCard
            id="sezione-immagini"
            title="Foto"
            description="La prima foto è la copertina. Usa le frecce per cambiare l'ordine e la stella per scegliere la copertina."
          >
            <GalleryUploader images={form.images} onChange={(images) => set("images", images)} />
          </SectionCard>
          <SectionCard
            id="sezione-categorie"
            title="Categorie *"
            description="Dove trovarlo nel negozio. Puoi sceglierne più di una."
          >
            <CategoryChecklist
              categories={categories}
              loading={categoriesLoading}
              value={form.categoriaIds}
              onChange={(ids) => set("categoriaIds", ids)}
              error={errors.categorie}
            />
          </SectionCard>
          <SectionCard
            id="sezione-varianti"
            title="Varianti"
            description="Scelte che il cliente fa prima di aggiungere al carrello (colore, fantasia…)."
          >
            <VariantsEditor value={form.varianti} onChange={(v) => set("varianti", v)} error={errors.varianti} />
          </SectionCard>
        </div>
        <div className="space-y-6">
          <div className="hidden xl:block">
            <PreviewCard form={form} />
          </div>
          <VisibilitySection form={form} set={set} />
          <OptionsSection form={form} set={set} errors={errors} />
        </div>
      </div>

      <SaveBar
        dirty={dirty}
        isNew={isNew}
        saving={saving}
        onSave={() => void save()}
        onCancel={() => void leave(listHref())}
      />
      {confirmDialog}
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div aria-busy="true" aria-label="Caricamento prodotto">
      <Skeleton className="mb-3 h-5 w-32" />
      <Skeleton className="mb-6 h-9 w-72" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
