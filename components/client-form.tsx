"use client";
import { useState } from "react";
import { Pencil, Plus, UserPlus } from "lucide-react";
import type { Customer } from "@/lib/schema";
import { criarCliente, editarCliente } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";
import { Modal } from "@/components/modal";

export function ClientFields({ customer }: { customer?: Customer }) {
  return (
    <>
      <div className="md:col-span-2">
        <Label>Nome</Label>
        <Input name="nome" required placeholder="Maria dos Santos" defaultValue={customer?.nome} />
      </div>
      <div>
        <Label>Telefone</Label>
        <Input name="telefone" required placeholder="923 000 000" inputMode="tel" defaultValue={customer?.telefone} />
      </div>
      <div>
        <Label>BI</Label>
        <Input name="bi" placeholder="Bilhete de Identidade" defaultValue={customer?.bi ?? ""} />
      </div>
      <div className="md:col-span-2">
        <Label>Notas</Label>
        <Input name="notas" placeholder="Referência / evento" defaultValue={customer?.notas ?? ""} />
      </div>
    </>
  );
}

export function ClientCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="size-4" /> Novo cliente
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo cliente" subtitle="Regista um cliente para futuros alugueres.">
        <form action={criarCliente} onSubmit={() => setOpen(false)} className="grid gap-3 md:grid-cols-2">
          <ClientFields />
          <div className="md:col-span-2">
            <Button type="submit" className="w-full" size="lg">
              Guardar cliente
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function ClientEditButton({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Editar ${customer.nome}`}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-900/5 text-ink-700 transition-colors hover:bg-brand-100 hover:text-brand-700 cursor-pointer"
      >
        <Pencil className="size-4" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar cliente" subtitle={customer.nome}>
        <form action={editarCliente.bind(null, customer.id)} onSubmit={() => setOpen(false)} className="grid gap-3 md:grid-cols-2">
          <ClientFields customer={customer} />
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" className="flex-1" size="lg">
              Guardar alterações
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// Re-export para o wizard usar o botão compacto
export function ClientQuickAddButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="secondary" onClick={onClick}>
      <Plus className="size-4" /> Novo
    </Button>
  );
}
