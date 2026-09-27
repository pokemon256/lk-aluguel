"use client";
import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Material } from "@/lib/schema";
import { MATERIAL_ICONS } from "@/lib/material-icons";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { Modal } from "@/components/modal";

export type Disp = Material & { comprometido: number; disponivel: number };
export type Linha = { materialId: string; quantidade: number; precoAcordado: number };

/** Mapa estático chave → componente (evita criar componentes durante o render). */
const ICON_COMPONENTS: Record<string, LucideIcon> = { Package };
for (const [key, entry] of Object.entries(MATERIAL_ICONS)) {
  ICON_COMPONENTS[key] = entry.icon;
}

function QtyStepper({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");

  function confirmar() {
    setEditando(false);
    const n = Math.floor(Number(texto));
    if (Number.isFinite(n)) onChange(Math.min(max, Math.max(1, n)));
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Diminuir"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="grid size-9 place-items-center rounded-full bg-ink-900/5 text-ink-800 transition-colors hover:bg-ink-900/10 active:scale-95 cursor-pointer"
      >
        <Minus className="size-4" />
      </button>
      {editando ? (
        <input
          autoFocus
          value={texto}
          inputMode="numeric"
          aria-label="Quantidade"
          onChange={(e) => setTexto(e.target.value.replace(/[^0-9]/g, ""))}
          onFocus={(e) => e.target.select()}
          onBlur={confirmar}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") setEditando(false);
          }}
          className="h-9 w-12 rounded-lg border border-brand-500 bg-white text-center text-sm font-bold tabular-nums outline-none ring-4 ring-brand-500/15"
        />
      ) : (
        <button
          type="button"
          title="Tocar para editar"
          aria-label={`Quantidade ${value}. Tocar para editar.`}
          onClick={() => {
            setTexto(String(value));
            setEditando(true);
          }}
          className="grid h-9 w-12 place-items-center rounded-lg text-sm font-bold tabular-nums transition-colors hover:bg-ink-900/5 active:scale-95 cursor-pointer"
        >
          {value}
        </button>
      )}
      <button
        type="button"
        aria-label="Aumentar"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid size-9 place-items-center rounded-full bg-ink-900/5 text-ink-800 transition-colors hover:bg-ink-900/10 active:scale-95 cursor-pointer"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function PickerRow({
  material,
  disp,
  linha,
  onAdd,
  onUpdateQty,
}: {
  material: Material;
  disp?: Disp;
  linha?: Linha;
  onAdd: (qty: number) => void;
  onUpdateQty: (qty: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const Icon = ICON_COMPONENTS[material.icone ?? "Package"] ?? Package;
  const max = disp ? disp.disponivel : material.quantidadeTotal;
  const esgotado = max <= 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ink-900/10 bg-white p-3.5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cream-100 text-ink-700">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-950">{material.nome}</p>
          <p className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge className="bg-cream-100 text-[11px] text-ink-700 ring-ink-900/10">{material.categoria}</Badge>
            {disp ? (
              esgotado ? (
                <Badge className="bg-red-50 text-[11px] text-red-700 ring-red-600/30">Esgotado · stock {material.quantidadeTotal}</Badge>
              ) : (
                <Badge className="bg-emerald-50 text-[11px] text-emerald-800 ring-emerald-600/25">
                  {disp.disponivel} livres · stock {material.quantidadeTotal}
                </Badge>
              )
            ) : (
              <Badge className="bg-cream-100 text-[11px] text-ink-700 ring-ink-900/10">Stock {material.quantidadeTotal}</Badge>
            )}
          </p>
        </div>
      </div>
      {linha ? (
        <div className="flex items-center justify-between gap-2 border-t border-ink-900/8 pt-3 sm:justify-end sm:border-0 sm:pt-0">
          <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Na lista</span>
          <QtyStepper value={linha.quantidade} max={Math.max(max, linha.quantidade)} onChange={onUpdateQty} />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 border-t border-ink-900/8 pt-3 sm:justify-end sm:border-0 sm:pt-0">
          {!esgotado && <QtyStepper value={qty} max={Math.max(1, max)} onChange={setQty} />}
          <Button
            size="sm"
            disabled={esgotado}
            onClick={() => onAdd(Math.min(qty, Math.max(1, max)))}
            className="min-h-9 flex-1 sm:flex-none"
          >
            {esgotado ? "Esgotado" : "Adicionar"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function MaterialPickerModal({
  open,
  onClose,
  materials,
  dispById,
  linhas,
  temDatas,
  onAdd,
  onUpdateQty,
}: {
  open: boolean;
  onClose: () => void;
  materials: Material[];
  dispById: Map<string, Disp>;
  linhas: Linha[];
  temDatas: boolean;
  onAdd: (materialId: string, qty: number) => void;
  onUpdateQty: (materialId: string, qty: number) => void;
}) {
  const [query, setQuery] = useState("");

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = materials.filter(
      (m) => !q || m.nome.toLowerCase().includes(q) || m.categoria.toLowerCase().includes(q)
    );
    return list.sort((a, b) => {
      const da = dispById.get(a.id)?.disponivel ?? Number.MAX_SAFE_INTEGER;
      const dbb = dispById.get(b.id)?.disponivel ?? Number.MAX_SAFE_INTEGER;
      if (da !== dbb) return dbb - da;
      return a.nome.localeCompare(b.nome, "pt-AO");
    });
  }, [materials, query, dispById]);

  const linhaById = useMemo(() => new Map(linhas.map((l) => [l.materialId, l])), [linhas]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Adicionar materiais"
      subtitle={
        temDatas
          ? "Disponibilidade calculada para as datas escolhidas."
          : "Escolhe as datas no passo 1 para ver a disponibilidade exata — por agora vês o stock total."
      }
    >
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-800/40" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar material…"
          className="!pl-10"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        {filtrados.length === 0 && (
          <p className="rounded-2xl border border-dashed border-ink-900/15 px-4 py-8 text-center text-sm text-ink-700/55">
            Nenhum material corresponde à pesquisa.
          </p>
        )}
        {filtrados.map((m) => (
          <PickerRow
            key={m.id}
            material={m}
            disp={dispById.get(m.id)}
            linha={linhaById.get(m.id)}
            onAdd={(qty) => onAdd(m.id, qty)}
            onUpdateQty={(qty) => onUpdateQty(m.id, qty)}
          />
        ))}
      </div>

      <Button onClick={onClose} className="mt-4 w-full" size="lg">
        Concluir ({linhas.length} {linhas.length === 1 ? "material" : "materiais"})
      </Button>
    </Modal>
  );
}
