import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NaoEncontrado() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 py-10 text-center animate-rise">
      <span className="grid size-16 place-items-center rounded-3xl bg-brand-100 text-brand-700">
        <Compass className="size-7" />
      </span>
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-950">
          Página não encontrada
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-700/70">
          O endereço não existe ou foi movido. Verifica o menu ou volta ao painel.
        </p>
      </div>
      <Link href="/">
        <Button>
          <Home className="size-4" /> Voltar ao painel
        </Button>
      </Link>
    </div>
  );
}
