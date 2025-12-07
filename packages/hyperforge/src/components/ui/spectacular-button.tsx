import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

// Wrapping motion.button logic manually or using standard button for simplicity first
export const SpectacularButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      glow = true,
      children,
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary:
        "bg-neon-blue/10 text-neon-blue border border-neon-blue/50 hover:bg-neon-blue/20 hover:border-neon-blue",
      secondary:
        "bg-glass-bg text-white border border-glass-border hover:bg-white/10",
      ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5",
      danger:
        "bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base font-medium",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center rounded-lg transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          glow &&
            variant === "primary" &&
            "shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_25px_rgba(0,243,255,0.5)]",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
SpectacularButton.displayName = "SpectacularButton";
