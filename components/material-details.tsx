"use client";
import { createElement, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  ChevronRight,
  History,
  Pencil,
  Search,
  StickyNote,
  Trash2,
} from "lucide-react";
import type { AuditLog, Material } from "@/lib/schema";
import { apagarMaterial, editarMaterial } from "@/lib/actions";
import { materialIcon } from "@/lib/material-icons";
import { Button } from "@/components/ui/button";
import { Badge, Input } from "@/components/ui/primitives";
import { RightSheet } from "@/components/sheet";
import { MaterialEditButton, MaterialFields } from "@/components/material-form";
import { ACAO_LABEL } from "@/components/signature";
import { formatData, formatDataHora, formatKz } from "@/lib/format";
import { cn } from "@/lib/utils";

export type UsoMaterial = {
  total: number;
  recentes: { id: string; cliente: string; data: Date; status: string }[];
};

function CategoriaBadge({ categoria, tint }: { categoria: string; tint: string }) {
  return <Badge className={tint}>{categoria}</Badge>;
}

function MatIcon({ icone, className }: { icone: string | null; className?: string }) {
  return createElement(materialIcon(icone), { className });
}

function MaterialSheet({
  material,
  tint,
  criadoPor,
  editadoPor,
  uso,
  historico,
  onClose,
}: {
  material: Material;
  tint: string;
  criadoPor: string;
  editadoPor: string | null;
  uso: UsoMaterial;
  historico: AuditLog[];
  onClose: () => void;
}) {
  const [aConfirmar, setAConfirmar] = useState(false);

  return (
    <RightSheet open onClose={onClose} title={material.nome} subtitle={material.categoria}>
      <div className="flex flex-col gap-5">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3.5">
          <span className={cn("grid size-14 shrink-0 place-items-center rounded-2xl", tint)}>
            <MatIcon icone={material.icone} className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5">
              <CategoriaBadge categoria={material.categoria} tint={tint} />
              {material.origem === "TERCEIRIZADO" ? (
                <Badge className="bg-gold-100 text-gold-600 ring-gold-500/30">
                  Terceiro{material.fornecedorNome ? ` · ${material.fornecedorNome}` : ""}
                </Badge>
              ) : (
                <Badge className="bg-cream-100 text-ink-700 ring-ink-900/10">Próprio</Badge>
              )}
              {!material.ativo && (
                <Badge className="bg-stone-100 text-stone-500 ring-stone-500/20">
                  Desativado
                </Badge>
              )}
            </p>
            <p className="mt-1.5 font-display text-2xl font-semibold text-ink-950">
              {formatKz(material.precoUnitario)}
              <span className="ml-1 align-middle text-xs font-normal text-ink-700/55">/ un.</span>
            </p>
          </div>
        </div>

        {/* Stock */}
        <section className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Em stock", value: String(material.quantidadeTotal) },
            { label: "Em alugueres", value: String(uso.total) },
            { label: "Valor total", value: formatKz(material.quantidadeTotal * material.precoUnitario) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-ink-900/10 bg-white px-2 py-3">
              <p className="truncate font-display text-lg font-semibold text-ink-950">{s.value}</p>
              <p className="text-[11px] font-medium text-ink-700/60">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Notas */}
        {material.notas && (
          <section className="rounded-2xl border border-gold-500/25 bg-gold-100/40 p-4">
            <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">
              <StickyNote className="size-3.5" /> Notas
            </h4>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-900">{material.notas}</p>
          </section>
        )}

        {/* Assinatura */}
        <p className="text-xs text-ink-700/60">
          Registado por {criadoPor}
          {editadoPor ? ` · editado por ${editadoPor}` : null} ·{" "}
          {formatDataHora(material.updatedAt)}
        </p>

        {/* Usado em */}
        {uso.recentes.length > 0 && (
          <section className="rounded-2xl border border-ink-900/10 bg-white p-4">
            <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-700/55">
              <Boxes className="size-3.5" /> Usado em ({uso.total})
            </h4>
            <div className="mt-2 flex flex-col">
              {uso.recentes.map((a) => (
                <Link
                  key={a.id}
                  href={`/alugueres/${a.id}`}
                  className="flex items-center justify-between gap-3 border-b border-ink-900/8 py-2 text-sm last:border-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink-950">{a.cliente}</span>
                    <span className="block text-xs text-ink-700/55">
                      {formatData(a.data)} · {a.status}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-ink-700/30" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Histórico */}
        {historico.length > 0 && (
          <section className="rounded-2xl border border-ink-900/10 bg-white p-4">
            <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-700/55">
              <History className="size-3.5" /> Histórico
            </h4>
            <ol className="mt-2.5 flex flex-col gap-2">
              {historico.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 text-[13px]">
                  <span className="text-ink-900">
                    <strong className="font-semibold">{l.actorEmail ?? "Sistema"}</strong>{" "}
                    <span className="text-ink-700/65">{ACAO_LABEL[l.acao] ?? l.acao}</span>
                  </span>
                  <span className="shrink-0 text-xs text-ink-700/55">{formatDataHora(l.at)}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Editar */}
        <section className="rounded-2xl border border-ink-900/10 bg-white p-4">
          <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-700/55">
            <Pencil className="size-3.5" /> Editar
          </h4>
          <form action={editarMaterial.bind(null, material.id)} className="mt-3 grid grid-cols-2 gap-3">
            <MaterialFields material={material} />
            <div className="col-span-2">
              <Button type="submit" variant="outline" className="w-full">
                Guardar alterações
              </Button>
            </div>
          </form>
        </section>

        {/* Zona de perigo */}
        <section className="rounded-2xl border border-red-600/20 bg-red-50/60 p-4">
          <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-red-700/80">
            <Trash2 className="size-3.5" /> Zona de perigo
          </h4>
          {!aConfirmar ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setAConfirmar(true)}
              className="mt-3 w-full !border-red-600/30 !text-red-700 hover:!bg-red-600/10"
            >
              Apagar material
            </Button>
          ) : (
            <form action={apagarMaterial.bind(null, material.id)} className="mt-3">
              <p className="text-[13px] text-red-800">
                Apagar <strong>{material.nome}</strong> para sempre?
                {uso.total > 0 &&
                  " Atenção: está usado em alugueres — a eliminação será bloqueada."}
              </p>
              <div className="mt-2.5 flex gap-2">
                <Button type="submit" variant="danger" className="flex-1">
                  Sim, apagar
                </Button>
                <Button type="button" variant="secondary" onClick={() => setAConfirmar(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>
    </RightSheet>
  );
}

export function MaterialsClient({
  lista,
  names,
  usos,
  historicos,
  tints,
}: {
  lista: Material[];
  names: Record<string, string>;
  usos: Record<string, UsoMaterial>;
  historicos: Record<string, AuditLog[]>;
  tints: Record<string, string>;
}) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState("");
  const q = pesquisa.trim().toLowerCase();
  const filtrada = q
    ? lista.filter(
        (m) =>
          m.nome.toLowerCase().includes(q) ||
          m.categoria.toLowerCase().includes(q) ||
          (m.fornecedorNome ?? "").toLowerCase().includes(q)
      )
    : lista;
  const selecionado = lista.find((m) => m.id === aberto) ?? null;

  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-700/40" />
        <Input
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar material, categoria ou fornecedor…"
          className="pl-10"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtrada.map((m, i) => {
          const tint = tints[m.categoria] ?? "bg-cream-100 text-ink-700";
          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => setAberto(m.id)}
              onKeyDown={(e) => e.key === "Enter" && setAberto(m.id)}
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              className={cn(
                "flex items-center gap-3.5 rounded-3xl border border-ink-900/10 bg-white p-5 text-left shadow-[0_1px_2px_rgba(23,15,12,0.05),0_12px_32px_-16px_rgba(23,15,12,0.18)] transition-all animate-rise hover:border-brand-500/40 hover:shadow-lg cursor-pointer",
                !m.ativo && "opacity-60"
              )}
            >
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", tint)}>
                <MatIcon icone={m.icone} className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-950">{m.nome}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-700/60">
                  <Badge className="bg-cream-100 text-ink-700 ring-ink-900/10">{m.categoria}</Badge>
                  {m.origem === "TERCEIRIZADO" && (
                    <Badge className="bg-gold-100 text-gold-600 ring-gold-500/30">
                      Terceiro{m.fornecedorNome ? ` · ${m.fornecedorNome}` : ""}
                    </Badge>
                  )}
                  {!m.ativo && (
                    <Badge className="bg-stone-100 text-stone-500 ring-stone-500/20">
                      Desativado
                    </Badge>
                  )}
                  <span>Stock: <strong className="text-ink-900">{m.quantidadeTotal}</strong></span>
                </p>
                {m.notas && (
                  <p className="mt-0.5 truncate text-xs italic text-ink-700/55">{m.notas}</p>
                )}
              </div>
              <p className="shrink-0 font-display text-lg font-semibold text-ink-950">
                {formatKz(m.precoUnitario)}
              </p>
              <span onClick={(e) => e.stopPropagation()}>
                <MaterialEditButton material={m} />
              </span>
            </div>
          );
        })}
      </div>
      {filtrada.length === 0 && (
        <p className="rounded-3xl border border-dashed border-ink-900/15 bg-white/50 px-6 py-10 text-center text-sm text-ink-700/60">
          Sem resultados para «{pesquisa}».
        </p>
      )}

      {selecionado && (
        <MaterialSheet
          material={selecionado}
          tint={tints[selecionado.categoria] ?? "bg-cream-100 text-ink-700"}
          criadoPor={
            selecionado.createdById ? (names[selecionado.createdById] ?? "—") : "—"
          }
          editadoPor={
            selecionado.updatedById && selecionado.updatedById !== selecionado.createdById
              ? (names[selecionado.updatedById] ?? null)
              : null
          }
          uso={usos[selecionado.id] ?? { total: 0, recentes: [] }}
          historico={historicos[selecionado.id] ?? []}
          onClose={() => setAberto(null)}
        />
      )}
    </>
  );
}
