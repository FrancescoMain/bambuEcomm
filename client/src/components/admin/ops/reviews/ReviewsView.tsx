"use client";

import { useState } from "react";
import { MessageSquareHeart, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, revalidateStorefront } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { PageTitle } from "@/components/admin/PageTitle";
import { useConfirm } from "@/components/admin/useConfirm";
import { Callout } from "../Callout";
import { FilterTabs } from "../FilterTabs";
import { useAsync } from "../useAsync";
import { useQueryParams } from "../useQueryParams";
import { type AdminReview, ReviewCard } from "./ReviewCard";

type Tab = "da-approvare" | "approvate";

const loadReviews = async () => {
  const [pending, approved] = await Promise.all([
    api<AdminReview[]>("/reviews", { query: { stato: "da-approvare" } }),
    api<AdminReview[]>("/reviews", { query: { stato: "approvate" } }),
  ]);
  return { pending, approved };
};

const byNewest = (a: AdminReview, b: AdminReview) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

export function ReviewsView() {
  const [params, setParams] = useQueryParams();
  const tab: Tab = params.get("stato") === "approvate" ? "approvate" : "da-approvare";
  const reviews = useAsync(loadReviews, []);
  const { data, setData } = reviews;
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const setApproved = async (review: AdminReview, approvata: boolean) => {
    setBusy(`${approvata ? "approve" : "hide"}:${review.id}`);
    try {
      await api(`/reviews/${review.id}`, { method: "PATCH", body: { approvata } });
      setData((prev) => {
        if (!prev) return prev;
        const updated = { ...review, approvata };
        const pending = prev.pending.filter((r) => r.id !== review.id);
        const approved = prev.approved.filter((r) => r.id !== review.id);
        return approvata
          ? { pending, approved: [updated, ...approved].sort(byNewest) }
          : { pending: [updated, ...pending].sort(byNewest), approved };
      });
      revalidateStorefront([`product:${review.productId}`]);
      toast.success(approvata ? "Recensione pubblicata sul sito." : "Recensione nascosta: non è più visibile sul sito.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (review: AdminReview) => {
    const ok = await confirm({
      title: "Eliminare la recensione?",
      message: `La recensione di ${review.nome} verrà eliminata definitivamente.`,
      confirmLabel: "Elimina",
      danger: true,
    });
    if (!ok) return;
    setBusy(`delete:${review.id}`);
    try {
      await api(`/reviews/${review.id}`, { method: "DELETE" });
      setData((prev) =>
        prev
          ? { pending: prev.pending.filter((r) => r.id !== review.id), approved: prev.approved.filter((r) => r.id !== review.id) }
          : prev
      );
      if (review.approvata) revalidateStorefront([`product:${review.productId}`]);
      toast.success("Recensione eliminata.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const list = data ? (tab === "approvate" ? data.approved : data.pending) : [];

  return (
    <div>
      <PageTitle
        title="Recensioni"
        description="Le recensioni dei clienti compaiono nella scheda prodotto solo dopo la tua approvazione."
        actions={
          <Button variant="outline" onClick={reviews.reload} loading={reviews.loading && !!data}>
            {!(reviews.loading && data) && <RefreshCw className="h-4 w-4" />}
            Aggiorna
          </Button>
        }
      />

      <FilterTabs
        label="Stato delle recensioni"
        value={tab}
        onChange={(value) => setParams({ stato: value === "da-approvare" ? null : value })}
        items={[
          { value: "da-approvare", label: "Da approvare", count: data?.pending.length ?? null, highlight: true },
          { value: "approvate", label: "Pubblicate", count: data?.approved.length ?? null },
        ]}
      />
      {tab === "da-approvare" && data && data.pending.length > 0 && (
        <p className="mt-3 text-sm text-ink-muted">
          Le recensioni nuove (e quelle nascoste) non sono visibili sul sito finché non le approvi.
        </p>
      )}

      <div className="mt-5">
        {reviews.error && !data ? (
          <Callout tone="danger" title="Impossibile caricare le recensioni">
            {reviews.error}
          </Callout>
        ) : !data ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<MessageSquareHeart className="h-7 w-7" />}
              title={tab === "approvate" ? "Nessuna recensione pubblicata" : "Nessuna recensione da approvare"}
              text={
                tab === "approvate"
                  ? "Le recensioni che approvi compaiono qui e nella scheda del prodotto."
                  : "Quando un cliente lascia una recensione la trovi qui."
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                busy={busy}
                onApprove={() => setApproved(review, true)}
                onHide={() => setApproved(review, false)}
                onDelete={() => remove(review)}
              />
            ))}
          </div>
        )}
      </div>
      {confirmDialog}
    </div>
  );
}
