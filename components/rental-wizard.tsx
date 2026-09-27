"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, UserPlus } from "lucide-react";
import type { Customer, Material } from "@/lib/schema";
import type { RentalInput } from "@/lib/validators";
import { criarAluguer, editarAluguer } from "@/lib/actions";
import { formatKz } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, Input, Label, Select } from "@/components/ui/primitives";
import { NumberInput } from "@/components/ui/number-input";
import { ClientQuickModal } from "@/components/client-quick-modal";
import { Disp, Linha, MaterialPickerModal } from "@/components/material-picker-modal";
import { cn } from "@/lib/utils";

const steps = ["Cliente e datas", "Materiais", "Pagamento"];

export type RentalFormInitial = {
  customerId: string;
  levantamento: string; // "YYYY-MM-DDTHH:mm"
  evento: string;
  caucao: number;
  pago: number;
  obs: string;
  linhas: Linha[];
};

function RentalForm({
  customers: initialCustomers,
  materials,
  initial,
  excludeRentalId,
  submitLabel,
  onSubmit,
}: {
  customers: Customer[];
  materials: Material[];
  initial?: RentalFormInitial;
  excludeRentalId?: string;
  submitLabel: string;
  onSubmit: (input: RentalInput) => Promise<string>;
}) {
  const router = useRouter();
  const [clientes, setClientes] = useState(initialCustomers);
  const [customerId, setCustomerId] = useState(initial?.customerId ?? initialCustomers[0]?.id ?? "");
  const [clienteModal, setClienteModal] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lev, setLev] = useState(initial?.levantamento ?? "");
  const [evento, setEvento] = useState(initial?.evento ?? "");
  const [caucao, setCaucao] = useState(initial?.caucao ?? 0);
  const [pago, setPago] = useState(initial?.pago ?? 0);
  const [obs, setObs] = useState(initial?.obs ?? "");
  const [disp, setDisp] = useState<Disp[] | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>(initial?.linhas ?? []);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fimPrevisto = useMemo(() => {
    if (!evento) return null;
    const d = new Date(evento);
    d.setHours(d.getHours() + 24);
    return d;
  }, [evento]);

  useEffect(() => {
    if (!lev || !evento) return;
    let cancelled = false;
    const fim = new Date(evento);
    fim.setHours(fim.getHours() + 24);
    const exclude = excludeRentalId ? `&exclude=${excludeRentalId}` : "";
    fetch(`/api/availability?inicio=${encodeURIComponent(lev)}&fim=${encodeURIComponent(fim.toISOString())}${exclude}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setDisp(d);
      })
      .catch(() => {
        if (!cancelled) setDisp(null);
      });
    return () => {
      cancelled = true;
    };
  }, [lev, evento, excludeRentalId]);

  const temDatas = Boolean(lev && evento);
  // Sem datas, a disponibilidade anterior é irrelevante — ignora-a sem setState no efeito.
  const dispById = useMemo(
    () => new Map(((temDatas ? disp : null) ?? []).map((d) => [d.id, d])),
    [disp, temDatas]
  );
  const total = linhas.reduce((s, l) => s + l.quantidade * l.precoAcordado, 0);
  const passoAtual = !temDatas ? 0 : linhas.length === 0 ? 1 : 2;

  function addMaterial(id: string, qty: number) {
    const m = materials.find((x) => x.id === id);
    if (!m || linhas.some((l) => l.materialId === id)) return;
    setLinhas([...linhas, { materialId: id, quantidade: qty, precoAcordado: m.precoUnitario }]);
  }

  function updateQty(id: string, qty: number) {
    setLinhas(linhas.map((l) => (l.materialId === id ? { ...l, quantidade: qty } : l)));
  }

  async function submit() {
    setErro(null);
    setLoading(true);
    try {
      const id = await onSubmit({
        customerId,
        dataLevantamento: new Date(lev),
        dataEvento: new Date(evento),
        valorCaucao: caucao,
        valorPago: pago,
        observacoes: obs || null,
        items: linhas,
      });
      router.push(`/alugueres/${id}`);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Indicador de passos */}
      <div className="flex items-center gap-2">
        {steps.map((st, i) => (
          <div key={st} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors",
                i < passoAtual
                  ? "bg-emerald-500 text-white"
                  : i === passoAtual
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-900/25"
                    : "bg-ink-900/8 text-ink-700/50"
              )}
            >
              {i < passoAtual ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn("hidden text-[13px] font-semibold sm:block", i === passoAtual ? "text-ink-950" : "text-ink-700/50")}>
              {st}
            </span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-ink-900/10" />}
          </div>
        ))}
      </div>

      <Card className="animate-rise">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-950">
          1 · Cliente e datas
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label>Cliente</Label>
            <div className="flex gap-2">
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="flex-1">
                {clientes.length === 0 && <option value="">Sem clientes</option>}
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} · {c.telefone}
                  </option>
                ))}
              </Select>
              <Button type="button" variant="secondary" onClick={() => setClienteModal(true)}>
                <UserPlus className="size-4" /> Novo
              </Button>
            </div>
          </div>
          <div>
            <Label>Levantamento</Label>
            <Input type="datetime-local" value={lev} onChange={(e) => setLev(e.target.value)} />
          </div>
          <div>
            <Label>Evento</Label>
            <Input type="datetime-local" value={evento} onChange={(e) => setEvento(e.target.value)} />
          </div>
        </div>
        {fimPrevisto && (
          <p className="mt-2.5 rounded-xl bg-cream-100 px-3.5 py-2 text-xs font-medium text-ink-700">
            Devolução prevista automática: {fimPrevisto.toLocaleString("pt-AO")} (evento + 24h)
          </p>
        )}
      </Card>

      <ClientQuickModal
        open={clienteModal}
        onClose={() => setClienteModal(false)}
        onCreated={(c) => {
          setClientes((prev) => (prev.some((p) => p.id === c.id) ? prev : [c, ...prev]));
          setCustomerId(c.id);
        }}
      />

      <Card className="animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink-950">
            2 · Materiais{" "}
            <span className="font-sans text-xs font-medium text-ink-700/55">
              {linhas.length === 0
                ? "· ainda vazio"
                : `· ${linhas.length} ${linhas.length === 1 ? "material" : "materiais"} · ${formatKz(total)}`}
            </span>
          </h2>
          <Button type="button" onClick={() => setPickerOpen(true)}>
            <Plus className="size-4" /> Adicionar material
          </Button>
        </div>

        {!temDatas && (
          <p className="mt-3 rounded-xl bg-gold-100 px-3.5 py-2 text-xs font-medium text-gold-600 ring-1 ring-inset ring-gold-500/25">
            Escolhe primeiro as datas no passo 1 — a disponibilidade de cada material é calculada para esse intervalo.
          </p>
        )}

        <div className="mt-3 flex flex-col gap-2.5">
          {linhas.map((l, i) => {
            const m = materials.find((x) => x.id === l.materialId)!;
            const d = dispById.get(l.materialId);
            return (
              <div key={l.materialId} className="grid grid-cols-2 items-end gap-3 rounded-2xl border border-ink-900/10 bg-cream-50/60 p-3.5 md:grid-cols-[1fr_110px_140px_auto]">
                <div>
                  <p className="text-sm font-semibold text-ink-950">{m.nome}</p>
                  <p className="text-xs text-ink-700/60">
                    {d ? `${d.disponivel} livres · stock ${m.quantidadeTotal}` : `Stock: ${m.quantidadeTotal}`}
                  </p>
                </div>
                <div>
                  <Label>Qtd</Label>
                  <NumberInput
                    min={1}
                    max={d?.disponivel ?? m.quantidadeTotal}
                    value={l.quantidade}
                    onChange={(n) =>
                      setLinhas(linhas.map((x, j) => (j === i ? { ...x, quantidade: n } : x)))
                    }
                  />
                </div>
                <div>
                  <Label>Preço un. (Kz)</Label>
                  <NumberInput
                    min={0}
                    value={l.precoAcordado}
                    onChange={(n) =>
                      setLinhas(linhas.map((x, j) => (j === i ? { ...x, precoAcordado: n } : x)))
                    }
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => setLinhas(linhas.filter((_, j) => j !== i))}>
                  Remover
                </Button>
              </div>
            );
          })}
          {linhas.length === 0 && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="rounded-2xl border border-dashed border-ink-900/20 px-4 py-8 text-center transition-colors hover:border-brand-500 hover:bg-brand-50 cursor-pointer"
            >
              <Plus className="mx-auto size-6 text-brand-600" />
              <span className="mt-1 block text-sm font-semibold text-ink-900">Adicionar o primeiro material</span>
              <span className="mt-0.5 block text-xs text-ink-700/55">Pesquisa por nome ou categoria, com disponibilidade</span>
            </button>
          )}
        </div>
      </Card>

      <MaterialPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        materials={materials}
        dispById={dispById}
        linhas={linhas}
        temDatas={temDatas}
        onAdd={addMaterial}
        onUpdateQty={updateQty}
      />

      <Card className="animate-rise md:sticky md:bottom-6">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-950">
          3 · Caução e pagamento
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <Label>Caução (Kz)</Label>
            <NumberInput min={0} value={caucao} onChange={setCaucao} />
          </div>
          <div>
            <Label>Valor já pago (Kz)</Label>
            <NumberInput min={0} value={pago} onChange={setPago} />
          </div>
          <div>
            <Label>Observações</Label>
            <Input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="50% na reserva…" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/10 pt-4">
          <p className="font-display text-2xl font-semibold tracking-tight text-ink-950">
            Total: {formatKz(total)}
          </p>
          <Button size="lg" disabled={loading || !customerId || !lev || !evento || linhas.length === 0} onClick={submit}>
            <Plus className="size-4" /> {loading ? "A guardar…" : submitLabel}
          </Button>
        </div>
        {erro && (
          <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            {erro}
          </p>
        )}
      </Card>
    </div>
  );
}

export function RentalWizard({
  customers,
  materials,
  initialCustomerId,
}: {
  customers: Customer[];
  materials: Material[];
  initialCustomerId?: string;
}) {
  return (
    <RentalForm
      customers={customers}
      materials={materials}
      initial={
        initialCustomerId
          ? {
              customerId: initialCustomerId,
              levantamento: "",
              evento: "",
              caucao: 0,
              pago: 0,
              obs: "",
              linhas: [],
            }
          : undefined
      }
      submitLabel="Guardar aluguer"
      onSubmit={criarAluguer}
    />
  );
}

export function RentalEditForm({
  rentalId,
  customers,
  materials,
  initial,
}: {
  rentalId: string;
  customers: Customer[];
  materials: Material[];
  initial: RentalFormInitial;
}) {
  return (
    <RentalForm
      customers={customers}
      materials={materials}
      initial={initial}
      excludeRentalId={rentalId}
      submitLabel="Guardar alterações"
      onSubmit={(input) => editarAluguer(rentalId, input)}
    />
  );
}
