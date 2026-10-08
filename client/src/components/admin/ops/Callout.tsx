import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "warning" | "danger" | "success" | "neutral";

const tones: Record<Tone, string> = {
  info: "border-sky/20 bg-sky-soft text-sky-ink",
  warning: "border-orange/25 bg-orange-soft text-orange-ink",
  danger: "border-magenta/20 bg-magenta-soft text-magenta-ink",
  success: "border-brand-200 bg-brand-50 text-brand-800",
  neutral: "border-paper-line bg-paper-warm text-ink-soft",
};

const icons: Record<Tone, React.ReactNode> = {
  info: <Info className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  danger: <OctagonAlert className="h-5 w-5" />,
  success: <CheckCircle2 className="h-5 w-5" />,
  neutral: <Info className="h-5 w-5" />,
};

/** Riquadro informativo (spiegazioni, avvisi, conferme) */
export function Callout({
  tone = "info",
  title,
  icon,
  children,
  className,
}: {
  tone?: Tone;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed", tones[tone], className)}>
      <span className="mt-px shrink-0" aria-hidden>
        {icon ?? icons[tone]}
      </span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={cn(!!title && "mt-1", "[&_a]:font-semibold [&_a]:underline")}>{children}</div>}
      </div>
    </div>
  );
}
