"use client";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import type { Material } from "@/lib/schema";
import { criarMaterial, editarMaterial } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/primitives";
import { IconPicker } from "@/components/icon-picker";
import { Modal } from "@/components/modal";

const CATEGORIAS = ["Mobiliário", "Têxteis", "Louças", "Painéis", "Decoração", "Estruturas", "Geral"];

export function MaterialFields({ material }: { material?: Material }) {
  return (
    <>
      <div className="col-span-2">
        <Label>Nome</Label>
        <Input name="nome" required placeholder="Cadeira Tiffany" defaultValue={material?.nome} />
      </div>
      <div>
        <Label>Categoria</Label>
        <Input name="categoria" defaultValue={material?.categoria ?? "Geral"} list="material-categorias" />
      </div>
      <div>
        <Label>Qtd total</Label>
        <Input name="quantidadeTotal" type="number" min={0} defaultValue={material?.quantidadeTotal ?? 10} required />
      </div>
      <div>
        <Label>Preço (Kz)</Label>
        <Input name="precoUnitario" type="number" min={0} defaultValue={material?.precoUnitario ?? 500} required />
      </div>
      <div>
        <Label>Origem</Label>
        <Select name="origem" defaultValue={material?.origem ?? "PROPRIO"}>
          <option value="PROPRIO">Próprio</option>
          <option value="TERCEIRIZADO">Terceirizado</option>
        </Select>
      </div>
      <div className="col-span-2">
        <Label>Ícone</Label>
        <IconPicker defaultValue={material?.icone} />
      </div>
      <div className="col-span-2">
        <Label htmlFor="mat-notas">Notas</Label>
        <textarea
          id="mat-notas"
          name="notas"
          rows={2}
          maxLength={500}
          placeholder="Ex: 4 com defeito ligeiro, comprar mais em Novembro…"
          defaultValue={material?.notas ?? ""}
          className="w-full rounded-xl border border-ink-900/15 bg-cream-50/50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-800/35 outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15"
        />
      </div>
      {material && (
        <div className="col-span-2">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-ink-900/15 px-3 text-sm text-ink-900">
            <input
              type="checkbox"
              name="ativo"
              defaultChecked={material.ativo}
              className="size-4 accent-brand-600"
            />
            Visível no catálogo (desmarca para desativar sem apagar)
          </label>
        </div>
      )}
      <datalist id="material-categorias">
        {CATEGORIAS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </>
  );
}

export function MaterialCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Novo material
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo material" subtitle="Adiciona um artigo ao inventário.">
        <form action={criarMaterial} onSubmit={() => setOpen(false)} className="grid grid-cols-2 gap-3">
          <MaterialFields />
          <div className="col-span-2 mt-1">
            <Button type="submit" className="w-full" size="lg">
              Guardar material
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function MaterialEditButton({ material }: { material: Material }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Editar ${material.nome}`}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-900/5 text-ink-700 transition-colors hover:bg-brand-100 hover:text-brand-700 cursor-pointer"
      >
        <Pencil className="size-4" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar material" subtitle={material.nome}>
        <form action={editarMaterial.bind(null, material.id)} onSubmit={() => setOpen(false)} className="grid grid-cols-2 gap-3">
          <MaterialFields material={material} />
          <div className="col-span-2 mt-1 flex gap-2">
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
