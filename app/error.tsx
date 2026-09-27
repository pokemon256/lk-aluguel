"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Home, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Fronteira de erro de cada segmento (ex: /materiais, /clientes).
 * Mostra a mensagem da ação (ex: "material em uso, desativa-o")
 * em vez de um ecrã genérico — com opção de tentar de novo.
 */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ui] erro capturado:", error.message, error.digest);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 py-10 text-center animate-rise">
      <span className="grid size-16 place-items-center rounded-3xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-600/20">
        <TriangleAlert className="size-7" />
      </span>
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-950">
          Algo correu mal
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-700/70">
          {error.message || "Ocorreu um erro inesperado. Tenta de novo."}
        </p>
        {error.digest && (
          <p className="mt-2 text-[11px] text-ink-700/45">Ref: {error.digest}</p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>
          <RotateCcw className="size-4" /> Tentar de novo
        </Button>
        <Link href="/">
          <Button variant="outline">
            <Home className="size-4" /> Voltar ao painel
          </Button>
        </Link>
      </div>
    </div>
  );
}
