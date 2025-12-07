import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NeonInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const NeonInput = forwardRef<HTMLInputElement, NeonInputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-glass-border bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-500",
            "focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 focus:shadow-[0_0_10px_rgba(0,243,255,0.2)]",
            "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            error &&
              "border-red-500 focus:border-red-500 focus:ring-red-500/50",
            className,
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
      </div>
    );
  },
);
NeonInput.displayName = "NeonInput";
