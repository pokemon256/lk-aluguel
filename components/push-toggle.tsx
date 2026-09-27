"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { ensurePushSubscription, getExistingSubscription, syncPushOnAppStart } from "@/lib/push-client";
import { Button } from "@/components/ui/button";

// Botão "Ativar alertas neste aparelho" + sync silencioso no arranque.
export function PushSync() {
  useEffect(() => {
    syncPushOnAppStart();
  }, []);
  return null;
}

export function PushToggle() {
  const [estado, setEstado] = useState<"verificar" | "ligado" | "desligado" | "sem-suporte" | "a-ligar">("verificar");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
          setEstado("sem-suporte");
          return;
        }
        if (Notification.permission !== "granted") {
          setEstado("desligado");
          return;
        }
        const sub = await getExistingSubscription();
        setEstado(sub ? "ligado" : "desligado");
      } catch {
        setEstado("desligado");
      }
    })();
  }, []);

  async function ligar() {
    setEstado("a-ligar");
    setErro(null);
    const r = await ensurePushSubscription();
    if (r.ok) {
      setEstado("ligado");
    } else {
      setEstado("desligado");
      setErro(r.erro === "bloqueado" ? "Permissão bloqueada no navegador. Ativa nas definições do site." : "Não foi possível ligar. Tenta de novo.");
    }
  }

  async function testar() {
    await fetch("/api/push/test", { method: "POST" }).catch(() => {});
  }

  if (estado === "verificar") return null;
  if (estado === "sem-suporte") return <p className="text-xs text-ink-700/60">Este navegador não suporta push.</p>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {estado === "ligado" ? (
        <>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/25">
            <BellRing className="size-3.5" /> Alertas ligados neste aparelho
          </span>
          <button type="button" onClick={testar} className="text-xs font-semibold text-brand-700 underline underline-offset-2 cursor-pointer">
            Enviar teste
          </button>
        </>
      ) : (
        <Button onClick={ligar} disabled={estado === "a-ligar"} size="sm">
          {estado === "a-ligar" ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-4" />}
          Ativar alertas neste aparelho
        </Button>
      )}
      {erro && <p className="w-full text-xs text-red-600">{erro}</p>}
    </div>
  );
}
