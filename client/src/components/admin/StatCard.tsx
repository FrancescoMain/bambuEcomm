import Link from "next/link";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "bg-brand-50 text-brand-700",
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: string;
  href?: string;
}) {
  const body = (
    <div className="card flex h-full items-start gap-4 p-5 transition hover:shadow-lift">
      {icon && <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tone)}>{icon}</span>}
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-extrabold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
