"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  // Portal para o body: evita que transforms de ancestrais (ex. animate-rise)
  // capturem o posicionamento fixed do overlay.
  const [mounted] = useState(() => typeof document !== "undefined");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-ink-950/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex min-h-full justify-center p-4">
        <div
          className={cn(
            "relative m-auto flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-2xl animate-rise",
            wide ? "max-w-2xl" : "max-w-lg"
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 p-6 pb-0 md:px-7">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight text-ink-950">{title}</h3>
              {subtitle && <p className="mt-0.5 text-sm text-ink-700/60">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-900/5 text-ink-700 transition-colors hover:bg-ink-900/10 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="overflow-y-auto p-6 md:px-7 md:pb-7">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
