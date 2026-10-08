import { Skeleton } from "@/components/ui/Spinner";

/** Scheletro mostrato durante la navigazione tra pagine catalogo */
export function CatalogSkeleton() {
  return (
    <div className="container pb-10 pt-6" aria-busy="true" aria-label="Caricamento">
      <Skeleton className="mb-5 h-4 w-40" />
      <Skeleton className="mb-8 h-10 w-64" />
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <div className="hidden space-y-4 lg:block">
          <Skeleton className="h-40" />
          <Skeleton className="h-56" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-paper-line bg-white">
              <Skeleton className="aspect-square rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
