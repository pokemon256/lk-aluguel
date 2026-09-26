"use client";
import { useState } from "react";
import type { Customer } from "@/lib/schema";
import { criarClienteRapido } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";
import { Modal } from "@/components/modal";

export function ClientQuickModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (c: Customer) => void;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [bi, setBi] = useState("");
  const [notas, setNotas] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErro(null);
    setLoading(true);
    try {
      const c = await criarClienteRapido({
        nome,
        telefone,
        bi: bi || null,
        notas: notas || null,
      });
      onCreated(c as Customer);
      setNome("");
      setTelefone("");
      setBi("");
      setNotas("");
      onClose();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo cliente" subtitle="Fica logo selecionado neste aluguer.">
      <div className="grid gap-3">
        <div>
          <Label>Nome</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Maria dos Santos" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Telefone</Label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="923 000 000" inputMode="tel" />
          </div>
          <div>
            <Label>BI (opcional)</Label>
            <Input value={bi} onChange={(e) => setBi(e.target.value)} placeholder="Bilhete de Identidade" />
          </div>
        </div>
        <div>
          <Label>Notas (opcional)</Label>
          <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Referência / evento" />
        </div>
        {erro && (
          <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            {erro}
          </p>
        )}
        <Button size="lg" disabled={loading || nome.trim().length < 2 || telefone.trim().length < 9} onClick={submit}>
          {loading ? "A guardar…" : "Guardar e selecionar"}
        </Button>
      </div>
    </Modal>
  );
}
