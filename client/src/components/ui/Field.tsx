import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

type BaseProps = { label?: string; hint?: string; error?: string | null; className?: string };

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & BaseProps>(
  function Input({ label, hint, error, className, id, ...rest }, ref) {
    const auto = useId();
    const inputId = id || auto;
    return (
      <div className={className}>
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
            {rest.required && <span className="text-magenta"> *</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${inputId}-desc` : undefined}
          className={cn("field", error && "border-magenta focus:border-magenta focus:ring-magenta/15")}
          {...rest}
        />
        {(error || hint) && (
          <p id={`${inputId}-desc`} className={cn("mt-1.5 text-xs", error ? "text-magenta-ink" : "text-ink-muted")}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps>(
  function Textarea({ label, hint, error, className, id, ...rest }, ref) {
    const auto = useId();
    const inputId = id || auto;
    return (
      <div className={className}>
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
            {rest.required && <span className="text-magenta"> *</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${inputId}-desc` : undefined}
          className={cn("field min-h-[110px]", error && "border-magenta")}
          {...rest}
        />
        {(error || hint) && (
          <p id={`${inputId}-desc`} className={cn("mt-1.5 text-xs", error ? "text-magenta-ink" : "text-ink-muted")}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & BaseProps>(
  function Select({ label, hint, error, className, id, children, ...rest }, ref) {
    const auto = useId();
    const inputId = id || auto;
    return (
      <div className={className}>
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
            {rest.required && <span className="text-magenta"> *</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${inputId}-desc` : undefined}
          className={cn("field pr-9", error && "border-magenta")}
          {...rest}
        >
          {children}
        </select>
        {(error || hint) && (
          <p id={`${inputId}-desc`} className={cn("mt-1.5 text-xs", error ? "text-magenta-ink" : "text-ink-muted")}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

export function Checkbox({
  label,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm text-ink-soft", className)}>
      <input
        type="checkbox"
        className="form-checkbox mt-0.5 h-[18px] w-[18px] shrink-0 rounded-md border-paper-line text-brand-600 focus:ring-brand-500/30"
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
}

/** Campo trappola anti-bot (nascosto agli utenti, i bot lo compilano) */
export function Honeypot() {
  return (
    <input
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden
      className="absolute -left-[9999px] h-0 w-0 opacity-0"
    />
  );
}
