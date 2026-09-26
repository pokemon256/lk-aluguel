import { cn } from "@/lib/utils";
import * as React from "react";

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-ink-900/10 bg-white p-5 shadow-[0_1px_2px_rgba(23,15,12,0.05),0_12px_32px_-16px_rgba(23,15,12,0.18)]",
        className
      )}
      {...p}
    />
  );
}

export function Input({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-ink-900/15 bg-cream-50/50 px-3.5 text-sm text-ink-900 placeholder:text-ink-800/35 outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15",
        className
      )}
      {...p}
    />
  );
}

export function Select({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-ink-900/15 bg-cream-50/50 px-3 text-sm text-ink-900 outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15",
        className
      )}
      {...p}
    />
  );
}

export function Label({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-[13px] font-semibold text-ink-800", className)}
      {...p}
    />
  );
}

export function Badge({ className, ...p }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        className
      )}
      {...p}
    />
  );
}

const STATUS_STYLE: Record<string, string> = {
  PENDENTE: "bg-amber-50 text-amber-800 ring-amber-600/25",
  ATIVO: "bg-sky-50 text-sky-800 ring-sky-600/25",
  CONCLUIDO: "bg-emerald-50 text-emerald-800 ring-emerald-600/25",
  ATRASADO: "bg-red-50 text-red-700 ring-red-600/30",
  COM_PROBLEMA: "bg-orange-50 text-orange-800 ring-orange-600/25",
  CANCELADO: "bg-stone-100 text-stone-500 ring-stone-500/20",
  PAGO: "bg-emerald-50 text-emerald-800 ring-emerald-600/25",
  PARCIAL: "bg-amber-50 text-amber-800 ring-amber-600/25",
};

const STATUS_DOT: Record<string, string> = {
  PENDENTE: "bg-amber-500",
  ATIVO: "bg-sky-500",
  CONCLUIDO: "bg-emerald-500",
  ATRASADO: "bg-red-500",
  COM_PROBLEMA: "bg-orange-500",
  CANCELADO: "bg-stone-400",
  PAGO: "bg-emerald-500",
  PARCIAL: "bg-amber-500",
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  ATIVO: "Em evento",
  CONCLUIDO: "Concluído",
  ATRASADO: "Atrasado",
  COM_PROBLEMA: "Com problema",
  CANCELADO: "Cancelado",
  PAGO: "Pago",
  PARCIAL: "Parcial",
};

/** @deprecated usa StatusBadge */
export function statusColor(s: string) {
  return STATUS_STYLE[s] ?? "bg-stone-100 text-stone-600 ring-stone-500/20";
}

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return (
    <Badge className={cn(STATUS_STYLE[value] ?? "bg-stone-100 text-stone-600 ring-stone-500/20", className)}>
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[value] ?? "bg-stone-400")} />
      {STATUS_LABEL[value] ?? value}
    </Badge>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 animate-rise">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 md:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-ink-700/70">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-ink-900/15 bg-white/50 px-6 py-10 text-center">
      <p className="font-display text-lg font-medium text-ink-900">{title}</p>
      {hint && <p className="mt-1 text-sm text-ink-700/60">{hint}</p>}
    </div>
  );
}
