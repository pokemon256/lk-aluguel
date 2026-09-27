"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Painel lateral direito estilo shadcn/ui Sheet.
 * Usado para detalhes com edição (ex: utilizador) sem sair da página.
 */
export function RightSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
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
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-ink-950/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream-50 shadow-2xl animate-slide-in">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-ink-900/10 p-5 md:px-6">
          <div className="min-w-0">
            <h3 className="truncate font-display text-xl font-semibold tracking-tight text-ink-950">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 truncate text-sm text-ink-700/60">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar painel"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-900/5 text-ink-700 transition-colors hover:bg-ink-900/10 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 md:px-6">{children}</div>
      </aside>
    </div>,
    document.body
  );
}
