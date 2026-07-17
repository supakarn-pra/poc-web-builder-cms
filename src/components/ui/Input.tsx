import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, className, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <label className="block space-y-1" htmlFor={inputId}>
        {label ? (
          <span className="text-sm font-medium text-text">{label}</span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-text-subtle focus:border-[color:var(--brand-primary)] focus:ring-2 focus:ring-[color:var(--brand-primary)]/20",
            className,
          )}
          {...rest}
        />
        {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
      </label>
    );
  },
);
Input.displayName = "Input";
