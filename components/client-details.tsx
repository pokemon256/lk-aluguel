"use client";
import { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  ChevronRight,
  History,
  Pencil,
  Phone,
  Plus,
  Search,
  StickyNote,
  Trash2,
} from "lucide-react";
import type { AuditLog, Customer } from "@/lib/schema";
import { apagarCliente, editarCliente } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Badge, Input } from "@/components/ui/primitives";
import { RightSheet } from "@/components/sheet";
import { ClientEditButton, ClientFields } from "@/components/client-form";
import { ACAO_LABEL } from "@/components/signature";
import { formatData, formatDataHora, formatKz } from "@/lib/format";

export type ResumoCliente = {
  eventos: number;
  total: number;
  emDivida: number;
  temAtivos: boolean;
  recentes: { id: string; data: Date; status: string; total: number }[];
};

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function ClientSheet({
  customer,
  resumo,
  criadoPor,
  editadoPor,
  historico,
  onClose,
}: {
  customer: Customer;
  resumo: ResumoCliente;
  criadoPor: string;
  editadoPor: string | null;
  historico: AuditLog[];
  onClose: () => void;
}) {
  const [aConfirmar, setAConfirmar] = useState(false);

  return (
    <RightSheet open onClose={onClose} title={customer.nome} subtitle={customer.telefone}>
      <div className="flex flex-col gap-5">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3.5">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-xl font-bold text-white">
            {iniciais(customer.nome)}
          </span>
          <div className="min-w-0">
            <a
              href={`tel:${customer.telefone.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-600"
            >
              <Phone className="size-4" /> {customer.telefone}
            </a>
            <p className="mt-1 text-xs text-ink-700/60">
              {customer.bi ? `BI ${customer.bi}` : "BI não registado"}
            </p>
            {resumo.temAtivos && (
              <Badge className="mt-1.5 bg-sky-50 text-sky-800 ring-sky-600/25">
                Com evento ativo
              </Badge>
            )}
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/clientes/${customer.id}`}>
            <Button variant="outline" className="w-full">
              Ficha completa
            </Button>
          </Link>
          <Link href={`/alugueres/novo?cliente=${customer.id}`}>
            <Button className="w-full">
              <Plus className="size-4" /> Novo aluguer
            </Button>
          </Link>
        </div>

        {/* Resumo */}
        <section className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Eventos", value: String(resumo.eventos) },
            { label: "Contratado", value: formatKz(resumo.total) },
            { label: "Em dívida", value: formatKz(resumo.emDivida) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-ink-900/10 bg-white px-2 py-3">
              <p className="truncate font-display text-lg font-semibold text-ink-950">{s.value}</p>
              <p className="text-[11px] font-medium text-ink-700/60">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Notas */}
        {customer.notas && (
          <section className="rounded-2xl border border-gold-500/25 bg-gold-100/40 p-4">
            <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">
              <StickyNote className="size-3.5" /> Notas
            </h4>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-900">{customer.notas}</p>
          </section>
        )}

        {/* Assinatura */}
        <p className="text-xs text-ink-700/60">
          Registado por {criadoPor}
          {editadoPor ? ` · editado por ${editadoPor}` : null} ·{" "}
          {formatDataHora(customer.updatedAt)}
        </p>

        {/* Alugueres recentes */}
        {resumo.recentes.length > 0 && (
          <section className="rounded-2xl border border-ink-900/10 bg-white p-4">
            <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-700/55">
              <CalendarCheck className="size-3.5" /> Alugueres recentes
            </h4>
            <div className="mt-2 flex flex-col">
              {resumo.recentes.map((a) => (
                <Link
                  key={a.id}
                  href={`/alugueres/${a.id}`}
                  className="flex items-center justify-between gap-3 border-b border-ink-900/8 py-2 text-sm last:border-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink-950">
                      {formatKz(a.total)}
                    </span>
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
          <form action={editarCliente.bind(null, customer.id)} className="mt-3 grid gap-3 md:grid-cols-2">
            <ClientFields customer={customer} />
            <div className="md:col-span-2">
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
              Apagar cliente
            </Button>
          ) : (
            <form action={apagarCliente.bind(null, customer.id)} className="mt-3">
              <p className="text-[13px] text-red-800">
                Apagar <strong>{customer.nome}</strong> para sempre?
                {resumo.eventos > 0 &&
                  " Atenção: tem alugueres — a eliminação será bloqueada."}
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

export function ClientsClient({
  lista,
  names,
  resumos,
  historicos,
}: {
  lista: Customer[];
  names: Record<string, string>;
  resumos: Record<string, ResumoCliente>;
  historicos: Record<string, AuditLog[]>;
}) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState("");
  const q = pesquisa.trim().toLowerCase();
  const filtrada = q
    ? lista.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          c.telefone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
          (c.bi ?? "").toLowerCase().includes(q)
      )
    : lista;
  const selecionado = lista.find((c) => c.id === aberto) ?? null;

  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-700/40" />
        <Input
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar nome, telefone ou BI…"
          className="pl-10"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtrada.map((c, i) => (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => setAberto(c.id)}
            onKeyDown={(e) => e.key === "Enter" && setAberto(c.id)}
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            className="flex items-center gap-3.5 rounded-3xl border border-ink-900/10 bg-white p-5 text-left shadow-[0_1px_2px_rgba(23,15,12,0.05),0_12px_32px_-16px_rgba(23,15,12,0.18)] transition-all animate-rise hover:border-brand-500/40 hover:shadow-lg cursor-pointer"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-base font-bold text-white">
              {iniciais(c.nome)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink-950">{c.nome}</p>
              <span className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-brand-700">
                <Phone className="size-3.5" /> {c.telefone}
              </span>
              {c.notas ? (
                <p className="mt-0.5 truncate text-xs italic text-ink-700/60">{c.notas}</p>
              ) : (
                c.bi && (
                  <p className="mt-0.5 text-[11px] text-ink-700/55">BI {c.bi}</p>
                )
              )}
            </div>
            <span onClick={(e) => e.stopPropagation()}>
              <ClientEditButton customer={c} />
            </span>
          </div>
        ))}
      </div>
      {filtrada.length === 0 && (
        <p className="rounded-3xl border border-dashed border-ink-900/15 bg-white/50 px-6 py-10 text-center text-sm text-ink-700/60">
          Sem resultados para «{pesquisa}».
        </p>
      )}

      {selecionado && (
        <ClientSheet
          customer={selecionado}
          resumo={
            resumos[selecionado.id] ?? {
              eventos: 0,
              total: 0,
              emDivida: 0,
              temAtivos: false,
              recentes: [],
            }
          }
          criadoPor={
            selecionado.createdById ? (names[selecionado.createdById] ?? "—") : "—"
          }
          editadoPor={
            selecionado.updatedById && selecionado.updatedById !== selecionado.createdById
              ? (names[selecionado.updatedById] ?? null)
              : null
          }
          historico={historicos[selecionado.id] ?? []}
          onClose={() => setAberto(null)}
        />
      )}
    </>
  );
}
