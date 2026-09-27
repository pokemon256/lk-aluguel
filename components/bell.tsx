"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell as BellIcon, CheckCheck, X } from "lucide-react";
import { useAlertsSync } from "@/hooks/use-alerts-sync";
import { cn } from "@/lib/utils";

// Sino de notificações: polling via useAlertsSync (60s visível / 120s oculto + BroadcastChannel).
export function Bell({ dark = false }: { dark?: boolean }) {
  const { unread, list, markAll, markRead } = useAlertsSync(true);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Notificações, ${unread} por ler`}
        className={cn(
          "relative grid size-9 shrink-0 place-items-center rounded-full transition-colors cursor-pointer",
          dark ? "bg-white/10 text-cream-50 hover:bg-white/20" : "bg-ink-900/5 text-ink-800 hover:bg-ink-900/10",
        )}
      >
        <BellIcon className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Notificações">
          <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-4 top-16 mx-auto flex max-h-[70vh] w-auto max-w-md flex-col rounded-3xl bg-white p-5 shadow-2xl md:inset-x-auto md:right-8 md:top-20 md:w-96">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-lg font-semibold text-ink-950">Notificações</p>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAll}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-700 underline underline-offset-2 cursor-pointer"
                  >
                    <CheckCheck className="size-3.5" /> Marcar lidas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar notificações"
                  className="grid size-8 place-items-center rounded-full bg-ink-900/5 text-ink-700 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto">
              {list.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "mb-2 rounded-2xl border p-3",
                    n.lida ? "border-ink-900/10 bg-white opacity-60" : "border-brand-600/30 bg-brand-50",
                  )}
                >
                  {n.url ? (
                    <Link
                      href={n.url}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                      }}
                      className="block"
                    >
                      <p className="text-sm font-semibold text-ink-950">{n.titulo}</p>
                      <p className="text-xs text-ink-700/60">{n.corpo}</p>
                    </Link>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-ink-950">{n.titulo}</p>
                      <p className="text-xs text-ink-700/60">{n.corpo}</p>
                    </div>
                  )}
                </li>
              ))}
              {list.length === 0 && (
                <li className="py-10 text-center text-sm text-ink-700/60">
                  Sem novidades. Levantamentos e atrasos aparecem aqui.
                </li>
              )}
            </ul>
            <Link
              href="/notificacoes"
              onClick={() => setOpen(false)}
              className="mt-2 text-center text-[13px] font-semibold text-brand-700 hover:text-brand-600"
            >
              Ver todas →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
