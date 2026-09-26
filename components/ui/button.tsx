import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none h-10 px-4 py-2 cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
  {
    variants: {
      variant: {
        default:
          "bg-brand-600 text-white shadow-lg shadow-brand-900/20 hover:bg-brand-700",
        dark: "bg-ink-900 text-cream-50 shadow-lg shadow-ink-950/20 hover:bg-ink-800",
        secondary: "bg-ink-900/5 text-ink-900 hover:bg-ink-900/10",
        outline:
          "border border-ink-900/15 bg-white/60 text-ink-900 hover:border-ink-900/30 hover:bg-white",
        danger: "bg-red-600 text-white shadow-lg shadow-red-900/20 hover:bg-red-500",
        success:
          "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-500",
        ghost: "text-ink-700 hover:bg-ink-900/5",
        gold: "bg-gold-400 text-ink-950 shadow-lg shadow-gold-600/25 hover:bg-gold-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-10 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
