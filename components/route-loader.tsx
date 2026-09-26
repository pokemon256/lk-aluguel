"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Barra de progresso no topo durante transições entre páginas.
 * Mostra ao clicar num link interno e esconde quando a nova rota assenta.
 */
function RouteLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A rota mudou (ou assentou) → esconder (deferido para fora do render).
  useEffect(() => {
    const t = setTimeout(() => {
      setActive(false);
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    }, 50);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  useEffect(() => {
    const show = () => {
      if (timer.current) clearTimeout(timer.current);
      // Só mostra se a navegação demorar >120ms (evita flash em rotas rápidas).
      timer.current = setTimeout(() => setActive(true), 120);
    };
    const onClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const el = (e.target as HTMLElement).closest?.("a[href]");
      if (!el) return;
      const href = el.getAttribute("href");
      if (!href || href.startsWith("#") || /^[a-z]+:/i.test(href)) return; // âncoras, tel:, mailto:, http…
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname + url.search !== window.location.pathname + window.location.search) show();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Rede de segurança: nunca ficar preso mais de 8s.
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(false), 8000);
    return () => clearTimeout(t);
  }, [active ]);

  if (!active) return null;
  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-ink-900/5">
      <div className="h-full w-1/3 rounded-r-full bg-gradient-to-r from-brand-500 via-brand-400 to-gold-400 animate-loader" />
    </div>
  );
}

export function RouteLoader() {
  return (
    <Suspense fallback={null}>
      <RouteLoaderInner />
    </Suspense>
  );
}
