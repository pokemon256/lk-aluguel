"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function PasswordInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className={cn("relative", className)}>
      <Input
        {...props}
        type={visivel ? "text" : "password"}
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
        title={visivel ? "Ocultar" : "Mostrar"}
        className="absolute inset-y-0 right-1 grid w-9 place-items-center rounded-lg text-ink-700/50 transition-colors hover:text-ink-900 cursor-pointer"
      >
        {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
