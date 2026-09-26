"use client";
import { useState } from "react";
import { MATERIAL_ICONS, MATERIAL_ICON_KEYS } from "@/lib/material-icons";
import { cn } from "@/lib/utils";

export function IconPicker({ defaultValue }: { defaultValue?: string | null }) {
  const [value, setValue] = useState<string>(
    defaultValue && defaultValue in MATERIAL_ICONS ? defaultValue : "Package"
  );
  return (
    <div>
      <input type="hidden" name="icone" value={value} />
      <div className="grid max-h-44 grid-cols-6 gap-1.5 overflow-y-auto rounded-xl border border-ink-900/10 bg-cream-50/50 p-2 sm:grid-cols-8">
        {MATERIAL_ICON_KEYS.map((key) => {
          const entry = MATERIAL_ICONS[key as keyof typeof MATERIAL_ICONS];
          const Icon = entry.icon;
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              title={entry.label}
              aria-label={entry.label}
              aria-pressed={selected}
              onClick={() => setValue(key)}
              className={cn(
                "grid aspect-square place-items-center rounded-xl transition-all active:scale-90 cursor-pointer",
                selected
                  ? "bg-brand-600 text-white shadow-md shadow-brand-900/30"
                  : "text-ink-700/60 hover:bg-brand-100 hover:text-brand-700"
              )}
            >
              <Icon className="size-5" />
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-ink-700/60">
        Selecionado: <strong className="text-ink-900">{MATERIAL_ICONS[value as keyof typeof MATERIAL_ICONS].label}</strong>
      </p>
    </div>
  );
}
