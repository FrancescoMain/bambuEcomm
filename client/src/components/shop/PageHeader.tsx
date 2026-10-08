import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { cn } from "@/lib/cn";

/** Intestazione standard delle pagine informative */
export function PageHeader({
  title,
  subtitle,
  crumbs,
  className,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  crumbs?: Crumb[];
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("bg-paper-warm bg-confetti", className)}>
      <div className="container py-10 sm:py-14">
        <Breadcrumbs items={crumbs || [{ label: title }]} className="mb-4" />
        <h1 className="text-balance text-3xl font-extrabold sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-lg text-ink-muted">{subtitle}</p>}
        {children}
      </div>
    </header>
  );
}
