"use client";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/modal";
import { cn } from "@/lib/utils";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function jaInstalado() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Botão "Baixar o app" (PWA).
 * - Android/Desktop Chromium: usa o prompt nativo de instalação.
 * - iPhone/iPad: mostra instruções (Partilhar → Ecrã principal).
 * - Esconde-se quando o app já está instalado.
 * `variant="menu"` veste como item do menu lateral.
 */
export function InstallAppButton({ variant = "default" }: { variant?: "default" | "menu" | "menulight" }) {
  // mounted sem setState-em-efeito; evita mismatch de hidratação.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [ios] = useState<boolean>(() => isIos());
  const [promptEv, setPromptEv] = useState<BIPEvent | null>(null);
  const [instalado, setInstalado] = useState<boolean>(() => jaInstalado());
  const [ajuda, setAjuda] = useState(false);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setPromptEv(e as BIPEvent);
    };
    const onInstalado = () => {
      setInstalado(true);
      setPromptEv(null);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalado);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalado);
    };
  }, []);

  const instalar = useCallback(async () => {
    if (!promptEv) {
      setAjuda(true);
      return;
    }
    await promptEv.prompt();
    const { outcome } = await promptEv.userChoice.catch(() => ({ outcome: "dismissed" as const }));
    if (outcome === "accepted") setPromptEv(null);
  }, [promptEv]);

  if (!mounted || instalado) return null;

  const onClick = ios || !promptEv ? () => setAjuda(true) : instalar;

  return (
    <>
      {variant === "menu" ? (
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-cream-50/65 transition-colors hover:bg-white/5 hover:text-cream-50 cursor-pointer"
        >
          <Download className="size-[18px]" /> Baixar o app
        </button>
      ) : variant === "menulight" ? (
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-ink-900 hover:bg-ink-900/5 cursor-pointer"
        >
          <Download className="size-5" /> Baixar o app
        </button>
      ) : (
        <Button type="button" variant="secondary" onClick={onClick} className="w-full">
          <Smartphone className="size-4" /> Baixar o app
        </Button>
      )}

      <Modal
        open={ajuda}
        onClose={() => setAjuda(false)}
        title="Baixar o app"
        subtitle="Leva a loja no bolso, mesmo sem internet no armazém."
      >
        {ios ? (
          <ol className="flex flex-col gap-3 text-sm text-ink-900">
            <li className="flex items-start gap-2.5">
              <Share className="mt-0.5 size-4 shrink-0 text-brand-600" />
              Toca em <strong>Partilhar</strong> na barra do Safari.
            </li>
            <li className="flex items-start gap-2.5">
              <Smartphone className="mt-0.5 size-4 shrink-0 text-brand-600" />
              Escolhe <strong>Adicionar ao Ecrã Principal</strong> e confirma em{" "}
              <strong>Adicionar</strong>.
            </li>
          </ol>
        ) : (
          <ol className="flex flex-col gap-3 text-sm text-ink-900">
            <li>
              1. Abre o menu do navegador (<strong>⋮</strong> no Chrome/Edge).
            </li>
            <li>
              2.               Escolhe <strong>Instalar LK Aluguel</strong> (ou «Adicionar ao ecrã
              principal» no telemóvel).
            </li>
            <li>3. Confirma — o ícone aparece junto às tuas apps.</li>
          </ol>
        )}
        <Button onClick={() => setAjuda(false)} className={cn("mt-4 w-full")} size="lg">
          Entendido
        </Button>
      </Modal>
    </>
  );
}
